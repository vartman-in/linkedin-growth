/**
 * Sales Machine Routes
 * Handles lead management, conversations, and pipeline
 */

import { Router, Request, Response, NextFunction } from 'express';
import { SalesMachineService } from '../services/sales-machine.service';
import { getPool } from '../config/database';
import { validate } from '../middleware/validation.middleware';
import { createLeadSchema, updateLeadSchema, uuidParamSchema } from '../middleware/validation.middleware';
import { authenticateAndSetWorkspace, requireWorkspaceAccess } from '../middleware/workspace.middleware';
import { NotFoundError } from '../middleware/error.middleware';

const router = Router();
const pool = getPool();
const salesMachineService = new SalesMachineService(pool);

// Apply secure authentication to all routes
router.use(authenticateAndSetWorkspace);
router.use(requireWorkspaceAccess);

// ============ LEADS ============

/**
 * @route GET /api/v1/sales/leads
 * @desc Get all leads in workspace
 */
router.get('/leads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string;
    const leads = await salesMachineService.getLeads(req.workspaceId!, status);
    res.json(leads);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/sales/leads/:id
 * @desc Get lead by ID
 */
router.get('/leads/:id', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await salesMachineService.getLead(req.workspaceId!, req.params.id as string);
    if (!lead) {
      throw new NotFoundError('Lead not found');
    }
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/sales/leads
 * @desc Create a new lead
 */
router.post('/leads', validate(createLeadSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await salesMachineService.createLead(req.workspaceId!, {
      name: req.body.name,
      profile_url: req.body.profileUrl,
      company: req.body.company,
      title: req.body.title,
      source: req.body.source
    });
    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/sales/leads/:id
 * @desc Update lead
 */
router.put('/leads/:id', validate(uuidParamSchema), validate(updateLeadSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await salesMachineService.updateLead(req.workspaceId!, req.params.id as string, {
      name: req.body.name,
      profile_url: req.body.profileUrl,
      company: req.body.company,
      title: req.body.title,
      status: req.body.status,
      source: req.body.source
    });
    if (!lead) {
      throw new NotFoundError('Lead not found');
    }
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/sales/leads/:id/qualify
 * @desc Qualify lead
 */
router.post('/leads/:id/qualify', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await salesMachineService.qualifyLead(req.workspaceId!, req.params.id as string);
    if (!lead) {
      throw new NotFoundError('Lead not found');
    }
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/sales/leads/:id/outreach
 * @desc Generate outreach message for lead
 */
router.post('/leads/:id/outreach', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await salesMachineService.generateOutreach(req.workspaceId!, req.params.id as string, req.body);
    res.json({ message });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/v1/sales/leads/:id
 * @desc Delete lead
 */
router.delete('/leads/:id', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await salesMachineService.deleteLead(req.workspaceId!, req.params.id as string);
    if (!deleted) {
      throw new NotFoundError('Lead not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ============ CONVERSATIONS ============

/**
 * @route POST /api/v1/sales/conversations
 * @desc Create a new conversation
 */
router.post('/conversations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await salesMachineService.createConversation(
      req.workspaceId!,
      req.body.leadId,
      req.body.channel
    );
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/sales/conversations/:id
 * @desc Get conversation by ID
 */
router.get('/conversations/:id', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await salesMachineService.getConversation(req.workspaceId!, req.params.id as string);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/sales/leads/:id/conversations
 * @desc Get conversations for lead
 */
router.get('/leads/:id/conversations', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversations = await salesMachineService.getConversationsForLead(req.workspaceId!, req.params.id as string);
    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/sales/conversations/:id/messages
 * @desc Add message to conversation
 */
router.post('/conversations/:id/messages', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await salesMachineService.addMessage(
      req.params.id as string,
      req.body.direction,
      req.body.body
    );
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/sales/conversations/:id/messages
 * @desc Get messages for conversation
 */
router.get('/conversations/:id/messages', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await salesMachineService.getMessages(req.params.id as string);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/sales/messages/classify
 * @desc Classify inbound message
 */
router.post('/messages/classify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classification = await salesMachineService.classifyMessage(req.body.message);
    res.json(classification);
  } catch (error) {
    next(error);
  }
});

// ============ PIPELINE ============

/**
 * @route GET /api/v1/sales/pipeline
 * @desc Get all opportunities in workspace
 */
router.get('/pipeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stage = req.query.stage as string;
    const opportunities = await salesMachineService.getOpportunities(req.workspaceId!, stage);
    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/sales/pipeline/:id
 * @desc Get opportunity by ID
 */
router.get('/pipeline/:id', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const opportunity = await salesMachineService.getOpportunity(req.workspaceId!, req.params.id as string);
    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }
    res.json(opportunity);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/sales/pipeline
 * @desc Create a new opportunity
 */
router.post('/pipeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const opportunity = await salesMachineService.createOpportunity(req.workspaceId!, req.body.leadId, {
      stage: req.body.stage,
      value: req.body.value,
      source: req.body.source
    });
    res.status(201).json(opportunity);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/sales/pipeline/:id/stage
 * @desc Update opportunity stage
 */
router.put('/pipeline/:id/stage', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const opportunity = await salesMachineService.updateOpportunityStage(
      req.workspaceId!,
      req.params.id as string,
      req.body.stage
    );
    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }
    res.json(opportunity);
  } catch (error) {
    next(error);
  }
});

export default router;
