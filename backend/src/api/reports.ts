// Reports API routes
import { Router, Request, Response } from 'express';
import { authMiddleware, requireAuth } from './auth.js';
import reportService, { ReportType } from '../services/reportService.js';
import subscriptionService from '../services/subscriptionService.js';
import userService from '../services/userService.js';
import { PRODUCTS } from '../config/stripe.js';

const router = Router();

// Get available report types with pricing
router.get('/available', async (_req: Request, res: Response) => {
  const reports = reportService.getAvailableReports();
  res.json({ reports });
});

// Get user's purchased reports
router.get('/', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    const reports = await reportService.getUserReports(req.userId!);

    res.json({
      reports: reports.map(r => ({
        id: r.id,
        type: r.report_type,
        title: r.title,
        generatedAt: r.generated_at,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

// Get a specific report
router.get('/:reportId', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const report = await reportService.getReport(req.userId!, reportId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      id: report.id,
      type: report.report_type,
      title: report.title,
      content: report.content,
      pdfUrl: report.pdf_url,
      birthProfile: report.birth_profile,
      partnerProfile: report.partner_profile,
      generatedAt: report.generated_at,
      createdAt: report.created_at,
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to get report' });
  }
});

// Check if user has access to a report type
router.get('/access/:reportType', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    const reportType = req.params.reportType as ReportType;
    const validTypes = ['monthly', 'annual', 'career', 'wealth', 'love', 'saturn_return', 'synastry_deep'];

    if (!validTypes.includes(reportType)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    const hasAccess = await reportService.hasReportAccess(req.userId!, reportType);
    const existingReport = await reportService.getReportByType(req.userId!, reportType);

    res.json({
      hasAccess,
      existingReport: existingReport ? {
        id: existingReport.id,
        generatedAt: existingReport.generated_at,
      } : null,
      price: PRODUCTS.reports[reportType]?.amount || 0,
    });
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Failed to check access' });
  }
});

// Generate a report (requires purchase)
router.post('/generate', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    const { reportType, language = 'en' } = req.body;
    const validTypes = ['monthly', 'annual', 'career', 'wealth', 'love', 'saturn_return', 'synastry_deep'];

    if (!reportType || !validTypes.includes(reportType)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    // Check if user has purchased this report type
    const hasAccess = await reportService.hasReportAccess(req.userId!, reportType);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Report not purchased', requiresPurchase: true });
    }

    // Get user's birth profile
    const user = await userService.findById(req.userId!);
    if (!user || !user.birth_profile) {
      return res.status(400).json({ error: 'Birth profile required' });
    }

    // Check if report already exists
    const existingReport = await reportService.getReportByType(req.userId!, reportType);
    if (existingReport) {
      return res.json({
        id: existingReport.id,
        type: existingReport.report_type,
        title: existingReport.title,
        content: existingReport.content,
        alreadyGenerated: true,
      });
    }

    // Generate the report
    const report = await reportService.generateReport(
      req.userId!,
      reportType,
      user.birth_profile,
      language
    );

    res.json({
      id: report.id,
      type: report.report_type,
      title: report.title,
      content: report.content,
      generatedAt: report.generated_at,
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Purchase and generate a report
router.post('/purchase', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    const { reportType, successUrl, cancelUrl } = req.body;
    const validTypes = ['monthly', 'annual', 'career', 'wealth', 'love', 'saturn_return', 'synastry_deep'];

    if (!reportType || !validTypes.includes(reportType)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'successUrl and cancelUrl required' });
    }

    // Check if already purchased
    const hasAccess = await reportService.hasReportAccess(req.userId!, reportType);
    if (hasAccess) {
      return res.status(400).json({ error: 'Report already purchased' });
    }

    const user = await userService.findById(req.userId!);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if subscriber for discount
    const subscription = await subscriptionService.getSubscription(req.userId!);
    const isSubscriber = subscription?.status === 'active';

    // Create checkout session for report purchase
    const checkoutUrl = await subscriptionService.createPurchaseCheckout({
      userId: req.userId!,
      email: user.email,
      productType: 'report',
      productId: reportType,
      successUrl,
      cancelUrl,
      isSubscriber,
    });

    res.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Purchase report error:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

// Delete a report
router.delete('/:reportId', authMiddleware, requireAuth, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const deleted = await reportService.deleteReport(req.userId!, reportId);

    if (!deleted) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
