// backend/src/controllers/queueController.ts
import { Request, Response, NextFunction } from 'express';
import { SortOrder, Types } from 'mongoose';
import { QueueToken, QueueTokenDocument } from '../models/QueueToken';
import { Voter, VoterDocument } from '../models/Voter';
import { io } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';
import { ParsedQs } from 'qs'; // Make sure this is imported if asyncHandler needs it
import { ParamsDictionary } from 'express-serve-static-core';
import ErrorResponse from '../utils/ErrorResponse';
import asyncHandler from '../middleware/asyncHandler';
import { spawn } from 'child_process'; // ** IMPORT spawn **
import path from 'path';             // ** IMPORT path **

const handleQueueError = (res: Response, error: unknown, context: string, statusCode: number = 500) => {
    const err = error as Error;
    console.error(`[QueueC] Error in ${context}:`, err.message, err.stack);
    if (error instanceof ErrorResponse) {
         res.status(error.statusCode).json({ success: false, message: error.message, details: error.details });
         return;
    }
    res.status(statusCode).json({ success: false, message: `Failed during ${context}`, error: err.message });
};

// --- Existing functions (requestVotingSlotStub, getTokens, completeToken, addToken, clearQueue) remain here ---
// For brevity, I'm not repeating them, assume they are as per your last provided version.
// Make sure they are updated as per my previous suggestions if you accepted those.

export const requestVotingSlotStub = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const context = "request voting slot (stub)";
    const voterIdFromToken = req.voterSession?.voterId;
    const voterFullNameFromToken = req.voterSession?.fullName;

    if (!voterIdFromToken) {
        return next(new ErrorResponse("Invalid session. Voter ID missing.", 403));
    }

    const voter: VoterDocument | null = await Voter.findById(voterIdFromToken);
    if (!voter) {
        return next(new ErrorResponse("Voter not found.", 404));
    }
    if (voter.hasVoted) {
        return next(new ErrorResponse("This voter has already cast their vote.", 403));
    }
    if (!voter.approved || voter.status !== 'Verified') { 
        return next(new ErrorResponse('Voter registration not approved or verified.', 403));
    }
    
    const boothNumberForToken = req.body.boothNumber || 'GeneralBooth'; 

    const existingToken = await QueueToken.findOne({ 
        voterId: voter._id, 
        status: { $in: ['waiting', 'processing'] },
        boothNumber: boothNumberForToken 
    });

    if (existingToken) {
        return res.status(200).json({
            success: true, 
            message: 'You are already in the queue for this booth.', 
            token: existingToken.toObject() 
        });
    }
    
    const lastTokenEntry = await QueueToken.findOne({ boothNumber: boothNumberForToken }).sort({ tokenNumber: -1 });
    const nextTokenNumber = lastTokenEntry && typeof lastTokenEntry.tokenNumber === 'number' ? lastTokenEntry.tokenNumber + 1 : 1;

    const newQueueEntryDoc = new QueueToken({
        tokenNumber: nextTokenNumber,
        voterName: voter.fullName || voterFullNameFromToken || 'Voter',
        voterId: voter._id,
        status: 'waiting',
        boothNumber: boothNumberForToken,
    });
    const newQueueEntry = await newQueueEntryDoc.save();

    io.emit('queue:new-entry', newQueueEntry.toObject());
    res.status(201).json({ success: true, message: 'Slot requested successfully. You are in the queue.', token: newQueueEntry.toObject() });
});

interface GetTokensQuery extends ParsedQs {
    status?: 'waiting' | 'processing' | 'completed';
    boothNumber?: string; 
    limit?: string; 
}
export const getTokens = asyncHandler(async (req: AuthRequest<ParamsDictionary, any, any, GetTokensQuery>, res: Response, next: NextFunction) => {
    const { status, boothNumber, limit } = req.query;
    
    const queryFilter: { status?: string; boothNumber?: string } = {};
    if (status && ['waiting', 'processing', 'completed'].includes(status)) {
        queryFilter.status = status;
    }
    if (boothNumber) {
        queryFilter.boothNumber = boothNumber;
    }

    const sortCriteria: { [key: string]: SortOrder } = {};
    if (status === 'completed') {
        sortCriteria['updatedAt'] = -1;
    } else {
        sortCriteria['createdAt'] = 1; 
    }
    
    let query = QueueToken.find(queryFilter)
        .sort(sortCriteria)
        .populate<{voterId: VoterDocument}>('voterId', 'fullName photoUrl');

    if (limit && parseInt(limit, 10) > 0) {
        query = query.limit(parseInt(limit, 10));
    }
        
    const tokens = await query.exec();
    
    console.log(`[QueueC] Fetched ${tokens.length} tokens with status: ${status || 'all'}, booth: ${boothNumber || 'all'}`);
    res.status(200).json(tokens.map(token => token.toObject()));
});
    
interface CompleteTokenParams extends ParamsDictionary {
    id: string;
}
export const completeToken = asyncHandler(async (req: AuthRequest<CompleteTokenParams, any, any, ParsedQs>, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const officerId = req.user?.id; 

    const token = await QueueToken.findByIdAndUpdate(
        id,
        { status: 'completed', updatedAt: new Date() }, 
        { new: true, runValidators: true }
    ).populate<{voterId: VoterDocument}>('voterId', 'fullName');

    if (!token) {
        return next(new ErrorResponse('Queue token not found', 404));
    }

    io.emit('queue:token-completed', token.toObject());
    io.emit('queue:update', { boothNumber: token.boothNumber }); 
    console.log(`[QueueC] Token ${token.tokenNumber} (${token.voterName}) for booth ${token.boothNumber} marked as completed by officer: ${officerId || 'Unknown'}.`);
    res.status(200).json({ success: true, message: 'Token marked as completed', token: token.toObject() });
});

interface AddTokenBody {
    voterName: string;
    voterId?: string;
    boothNumber?: string;
}
export const addToken = asyncHandler(async (req: AuthRequest<ParamsDictionary, any, AddTokenBody, ParsedQs>, res: Response, next: NextFunction) => {
    const officerId = req.user?.id;
    const { voterName, voterId, boothNumber: requestBoothNumber } = req.body;
    
    const targetBoothNumber = requestBoothNumber || 'GeneralBooth';

    if (!voterName) {
        return next(new ErrorResponse('Voter name is required for manual token addition.', 400));
    }
    
    const lastToken = await QueueToken.findOne({ boothNumber: targetBoothNumber }).sort({ tokenNumber: -1 });
    const nextTokenNumber = lastToken && typeof lastToken.tokenNumber === 'number' ? lastToken.tokenNumber + 1 : 1;

    const tokenData: Partial<QueueTokenDocument> = {
        tokenNumber: nextTokenNumber,
        voterName,
        status: 'waiting',
        boothNumber: targetBoothNumber
    };
    if (voterId && Types.ObjectId.isValid(voterId)) {
        tokenData.voterId = new Types.ObjectId(voterId);
    }

    const tokenDoc = new QueueToken(tokenData);
    const token = await tokenDoc.save();

    io.emit('queue:new-entry', token.toObject());
    io.emit('queue:update', { boothNumber: targetBoothNumber });
    console.log(`[QueueC] Officer ${officerId || 'Unknown'} manually added token ${nextTokenNumber} for ${voterName} to booth ${targetBoothNumber}.`);
    res.status(201).json({ success: true, message: 'Token added manually', token: token.toObject() });
});
    
export const clearQueue = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const adminOrOfficerId = req.user?.id;
    const { boothNumber } = req.query as { boothNumber?: string };

    const deleteFilter: { status: { $in: Array<'waiting'|'processing'> }, boothNumber?: string } = { 
        status: { $in: ['waiting', 'processing'] } 
    };

    if (boothNumber) {
        deleteFilter.boothNumber = boothNumber;
        console.log(`[QueueC] Attempting to clear WAITING and PROCESSING queue for booth: ${boothNumber} by admin/officer: ${adminOrOfficerId || 'Unknown'}`);
    } else {
        console.log(`[QueueC] Attempting to clear ALL WAITING and PROCESSING queues by admin/officer: ${adminOrOfficerId || 'Unknown'}`);
    }
    
    const result = await QueueToken.deleteMany(deleteFilter);
    
    io.emit('queue:cleared', { boothNumber: boothNumber || 'all' });
    io.emit('queue:update', { boothNumber: boothNumber || 'all' });
    console.log(`[QueueC] Queue cleared. ${result.deletedCount} tokens removed for filter:`, deleteFilter);
    res.status(200).json({ success: true, message: 'Active queue cleared successfully', deletedCount: result.deletedCount });
});


// ** MODIFIED FUNCTION to call Python script **
const DEFAULT_AVG_PROCESSING_TIME_MINUTES_FALLBACK = 5;
const MIN_SAMPLES_FOR_DYNAMIC_AVG_FALLBACK = 3;
const MAX_SAMPLES_FOR_DYNAMIC_AVG_FALLBACK = 20;

export const getEstimatedWaitTime = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { boothNumber } = req.query as { boothNumber?: string };
    
    const waitingFilter: { status: string; boothNumber?: string } = { status: 'waiting' };
    if (boothNumber) {
        waitingFilter.boothNumber = boothNumber;
    }
    const waitingTokensCount = await QueueToken.countDocuments(waitingFilter);

    if (waitingTokensCount === 0) {
        return res.status(200).json({
            success: true,
            boothNumber: boothNumber || 'all',
            estimatedWaitTimeMinutes: 0,
            waitingCount: 0,
            calculationBasis: "heuristic (queue empty)",
            message: "The queue is currently empty."
        });
    }

    // Fallback heuristic for average processing time (same as before)
    let averageProcessingTimeMinutes = DEFAULT_AVG_PROCESSING_TIME_MINUTES_FALLBACK;
    const completedFilter: { status: string; boothNumber?: string; updatedAt: { $exists: true }; createdAt: { $exists: true } } = {
        status: 'completed',
        updatedAt: { $exists: true },
        createdAt: { $exists: true },
    };
    if (boothNumber) {
        completedFilter.boothNumber = boothNumber;
    }
    const recentCompletedTokens = await QueueToken.find(completedFilter)
        .sort({ updatedAt: -1 })
        .limit(MAX_SAMPLES_FOR_DYNAMIC_AVG_FALLBACK)
        .lean<QueueTokenDocument[]>();

    let validSamplesCount = 0;
    if (recentCompletedTokens.length > 0) {
        let totalProcessingTimeForAvgMs = 0;
        for (const token of recentCompletedTokens) {
            if (token.createdAt && token.updatedAt) {
                const createdTime = new Date(token.createdAt).getTime();
                const updatedTime = new Date(token.updatedAt).getTime();
                if (!isNaN(createdTime) && !isNaN(updatedTime) && updatedTime > createdTime) {
                    totalProcessingTimeForAvgMs += (updatedTime - createdTime);
                    validSamplesCount++;
                }
            }
        }
        if (validSamplesCount >= MIN_SAMPLES_FOR_DYNAMIC_AVG_FALLBACK) {
            averageProcessingTimeMinutes = Math.round((totalProcessingTimeForAvgMs / validSamplesCount) / (1000 * 60));
        }
    }

    // Path to your Python script - adjust this carefully!
    // This path needs to be relative to where your compiled JS files will be (e.g., in the 'dist' folder)
    // or use an absolute path, or configure it via an environment variable.
    // For development, if ml_scripts is at backend/src/ml_scripts and controllers at backend/src/controllers
    // and assuming your script runs from backend/dist (after tsc compilation)
    const scriptPath = path.join(__dirname, '..', 'ml_scripts', 'predict_wait_time.py');
    // For a robust solution, consider how this path resolves in production.
    // Often, these scripts might be copied to the 'dist' directory during the build process.
    // Example: if ml_scripts is copied to dist/ml_scripts, then:
    // const scriptPath = path.join(__dirname, '..', 'ml_scripts', 'predict_wait_time.py');
    // If your tsconfig outDir is 'dist' and rootDir is 'src', __dirname in dist/controllers will point to dist/controllers.
    // So, path.join(__dirname, '../ml_scripts/predict_wait_time.py') might resolve to dist/ml_scripts/predict_wait_time.py
    // Ensure your build process copies the ml_scripts directory to dist.


    const pythonProcess = spawn('python3', [ // Use 'python3' or 'python' based on your environment
        scriptPath,
        waitingTokensCount.toString(),
        averageProcessingTimeMinutes.toString() // Pass the heuristic-calculated average as a feature
    ]);

    let scriptOutput = '';
    let scriptError = '';

    pythonProcess.stdout.on('data', (data) => {
        scriptOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        scriptError += data.toString();
        console.error(`[QueueC] Python script stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0 || scriptError) {
            console.error(`[QueueC] Python script exited with code ${code} and error: ${scriptError}`);
            // Fallback to heuristic if Python script fails
            const heuristicWaitTime = waitingTokensCount * averageProcessingTimeMinutes;
            return res.status(200).json({
                success: true,
                boothNumber: boothNumber || 'all',
                estimatedWaitTimeMinutes: Math.max(0, heuristicWaitTime),
                waitingCount: waitingTokensCount,
                averageProcessingTimeMinutes: averageProcessingTimeMinutes,
                calculationBasis: `heuristic (Python script failed: ${scriptError || `exit code ${code}`})`,
                message: "Estimated wait time calculated using fallback heuristic."
            });
        }

        try {
            const predictionResult = JSON.parse(scriptOutput);
            if (predictionResult.error) {
                console.error(`[QueueC] Error from Python script logic: ${predictionResult.error}`);
                // Fallback to heuristic if Python script reports an internal error
                const heuristicWaitTime = waitingTokensCount * averageProcessingTimeMinutes;
                return res.status(200).json({
                    success: true,
                    boothNumber: boothNumber || 'all',
                    estimatedWaitTimeMinutes: Math.max(0, heuristicWaitTime),
                    waitingCount: waitingTokensCount,
                    averageProcessingTimeMinutes: averageProcessingTimeMinutes,
                    calculationBasis: `heuristic (Python script error: ${predictionResult.error})`,
                    message: "Estimated wait time calculated using fallback heuristic."
                });
            }

            res.status(200).json({
                success: true,
                boothNumber: boothNumber || 'all',
                estimatedWaitTimeMinutes: predictionResult.estimatedWaitTimeMinutes,
                waitingCount: waitingTokensCount,
                averageProcessingTimeMinutes: averageProcessingTimeMinutes, // Can be from heuristic or passed to model
                calculationBasis: predictionResult.calculationBasis || "Python placeholder script",
                message: "Estimated wait time calculated by prediction script."
            });
        } catch (parseError) {
            console.error('[QueueC] Error parsing Python script output:', parseError, "Output was:", scriptOutput);
            // Fallback to heuristic if output parsing fails
            const heuristicWaitTime = waitingTokensCount * averageProcessingTimeMinutes;
            return res.status(200).json({
                success: true,
                boothNumber: boothNumber || 'all',
                estimatedWaitTimeMinutes: Math.max(0, heuristicWaitTime),
                waitingCount: waitingTokensCount,
                averageProcessingTimeMinutes: averageProcessingTimeMinutes,
                calculationBasis: "heuristic (Python script output parsing failed)",
                message: "Estimated wait time calculated using fallback heuristic."
            });
        }
    });

    pythonProcess.on('error', (err) => {
        console.error('[QueueC] Failed to start Python subprocess.', err);
        // Fallback to heuristic if Python process cannot be started
        const heuristicWaitTime = waitingTokensCount * averageProcessingTimeMinutes;
        next(new ErrorResponse(`Failed to start prediction service. Using fallback. Estimated wait: ${heuristicWaitTime} min.`, 500));
         // Or send a success with heuristic:
        // res.status(200).json({
        //     success: true,
        //     boothNumber: boothNumber || 'all',
        //     estimatedWaitTimeMinutes: Math.max(0, heuristicWaitTime),
        //     waitingCount: waitingTokensCount,
        //     averageProcessingTimeMinutes: averageProcessingTimeMinutes,
        //     calculationBasis: "heuristic (prediction service unavailable)",
        //     message: "Estimated wait time calculated using fallback heuristic."
        // });
    });
});