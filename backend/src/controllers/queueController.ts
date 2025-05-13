// backend/src/controllers/queueController.ts
import { Response } from 'express'; // Standard Express Response
import { SortOrder, Types } from 'mongoose';
import { QueueToken, QueueTokenDocument } from '../models/QueueToken';
import { Voter, VoterDocument } from '../models/Voter';
import { io } from '../server';
import { AuthRequest } from '../middleware/authMiddleware'; // Our generic AuthRequest
import { ParsedQs } from 'qs'; // For typing req.query
import { ParamsDictionary } from 'express-serve-static-core'; // For URL params

const handleQueueError = (res: Response, error: unknown, context: string, statusCode: number = 500) => {
    const err = error as Error;
    console.error(`[QueueC] Error in ${context}:`, err.message, err.stack);
    res.status(statusCode).json({ message: `Failed during ${context}`, error: err.message });
};

// requestVotingSlotStub: No URL params, no specific body, no specific query
export const requestVotingSlotStub = async (req: AuthRequest, res: Response): Promise<void> => {
    const context = "request voting slot (stub)";
    const voterIdFromToken = req.voterSession?.voterId; 
    const voterFullNameFromToken = req.voterSession?.fullName; 

    if (!voterIdFromToken) {
        console.error(`[QueueC] ${context}: Voter ID missing from session token.`);
        res.status(403).json({ message: "Invalid session. Voter ID missing." });
        return; 
    }
    // ... (rest of the logic as in queue_controller_ts_fixes_v3/v4)
    // Ensure voter lookup, hasVoted check, existing token check, token creation, and response are correct.
    // For brevity, assuming the internal logic is correct from previous versions.
    // This is a placeholder for the full function logic.
    try {
        const voter: VoterDocument | null = await Voter.findById(voterIdFromToken);
        if (!voter) { /* ... handle ... */ res.status(404).json({message: "Voter not found"}); return; }
        if (voter.hasVoted) { /* ... handle ... */  res.status(403).json({message: "Already voted"}); return; }

        // Simplified queue token creation for example
        const newQueueEntry = await QueueToken.create({
            tokenNumber: new Date().getTime() % 10000, // Simplistic token number
            voterName: voter.fullName || voterFullNameFromToken || 'Voter',
            voterId: voter._id, 
            status: 'waiting',
            allottedTime: new Date(Date.now() + 10 * 60000),
        });
        io.emit('queue:new-entry', newQueueEntry.toObject()); 
        res.status(200).json({ success: true, message: 'Slot requested (stub)', token: newQueueEntry });

    } catch (error) {
        handleQueueError(res, error, context);
    }
};

interface GetTokensQuery extends ParsedQs {
    status?: 'waiting' | 'processing' | 'completed';
}
// getTokens: No URL params, no body, but has query params
export const getTokens = async (req: AuthRequest<ParamsDictionary, any, any, GetTokensQuery>, res: Response): Promise<void> => {
    const context = "get tokens";
    try {
        const { status } = req.query; // req.query is now typed by GetTokensQuery
        
        const queryFilter: { status?: string } = {};
        if (status && ['waiting', 'processing', 'completed'].includes(status)) {
            queryFilter.status = status;
        }

        const sortCriteria: { [key: string]: SortOrder } = {};
        if (status === 'completed') {
            sortCriteria['updatedAt'] = -1; 
        } else {
            sortCriteria['createdAt'] = 1; 
        }
        
        const tokens = await QueueToken.find(queryFilter)
            .sort(sortCriteria)
            .populate<{voterId: VoterDocument}>('voterId', 'fullName aadhaarNumber registerNumber photoUrl');
        
        console.log(`[QueueC] Fetched ${tokens.length} tokens with status: ${status || 'all'}`);
        res.status(200).json(tokens);
    } catch (error) {
        handleQueueError(res, error, context);
    }
};
    
interface CompleteTokenParams extends ParamsDictionary { // Ensures it's compatible with Express's ParamsDictionary
    id: string; 
}
// completeToken: Has URL param 'id', no specific body or query
export const completeToken = async (req: AuthRequest<CompleteTokenParams, any, any, ParsedQs>, res: Response): Promise<void> => {
    const context = "complete token";
    const { id } = req.params; // 'id' is now known to be string due to CompleteTokenParams
    const officerId = req.user?.id; 
    console.log(`[QueueC] Attempting to complete token ID: ${id} by officer: ${officerId || 'Unknown'}`);
    try {
        const token = await QueueToken.findByIdAndUpdate(
            id,
            { status: 'completed' }, 
            { new: true }
        ).populate<{voterId: VoterDocument}>('voterId', 'fullName');

        if (!token) {
            res.status(404).json({ message: 'Queue token not found' });
            return;
        }

        io.emit('queue:token-completed', token.toObject());
        io.emit('queue:update'); 
        console.log(`[QueueC] Token ${token.tokenNumber} (${token.voterName}) marked as completed.`);
        res.status(200).json({ message: 'Token marked as completed', token });
    } catch (error) {
        handleQueueError(res, error, context);
    }
};

interface AddTokenBody { 
    voterName: string; 
    voterId?: string; 
    boothNumber?: string; 
}
// addToken: No URL params, has body, no query
export const addToken = async (req: AuthRequest<ParamsDictionary, any, AddTokenBody, ParsedQs>, res: Response): Promise<void> => {
    const context = "add token manually";
    const officerId = req.user?.id;
    try {
        const { voterName, voterId, boothNumber } = req.body; // req.body is now typed AddTokenBody
        if (!voterName) {
            res.status(400).json({ message: 'Voter name is required for manual token addition.' });
            return;
        }
        console.log(`[QueueC] Officer ${officerId || 'Unknown'} attempting to manually add token for ${voterName}`);

        const lastToken = await QueueToken.findOne().sort({ tokenNumber: -1 });
        const nextTokenNumber = lastToken && typeof lastToken.tokenNumber === 'number' ? lastToken.tokenNumber + 1 : 1;

        const tokenData: Partial<QueueTokenDocument> = { 
            tokenNumber: nextTokenNumber, 
            voterName, 
            status: 'waiting' 
        };
        if (voterId && Types.ObjectId.isValid(voterId)) {
            tokenData.voterId = new Types.ObjectId(voterId);
        }
        if (boothNumber) { // This assignment is correct if QueueTokenDocument.boothNumber is optional
            tokenData.boothNumber = boothNumber; 
        }

        const token = new QueueToken(tokenData);
        await token.save();

        io.emit('queue:new-entry', token.toObject());
        io.emit('queue:update');
        console.log(`[QueueC] Manual token ${nextTokenNumber} added for ${voterName}.`);
        res.status(201).json({ message: 'Token added manually', token });
    } catch (error) {
        handleQueueError(res, error, context);
    }
};
    
// clearQueue: No URL params, no body, no query
export const clearQueue = async (req: AuthRequest, res: Response): Promise<void> => {
    const context = "clear queue";
    const adminOrOfficerId = req.user?.id;
    console.log(`[QueueC] Attempting to clear WAITING and PROCESSING queue by admin/officer: ${adminOrOfficerId || 'Unknown'}`);
    try {
        const result = await QueueToken.deleteMany({ status: { $in: ['waiting', 'processing'] } });
        io.emit('queue:cleared'); 
        io.emit('queue:update');
        console.log(`[QueueC] Waiting and processing queue cleared. ${result.deletedCount} tokens removed.`);
        res.status(200).json({ message: 'Active queue (waiting/processing) cleared successfully', deletedCount: result.deletedCount });
    } catch (error) {
        handleQueueError(res, error, context);
    }
};
