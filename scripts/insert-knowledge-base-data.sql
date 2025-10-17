-- Insert Legacy Decks Academy Knowledge Base Content
-- This script adds financial tasks, receipt management, and QuickBooks items to the knowledge base

-- 1. Weekly/Monthly/Quarterly/Yearly Financial Tasks
INSERT INTO knowledge_chunks (
  id,
  gpt_id,
  content,
  category,
  subcategory,
  processing_method,
  metadata,
  created_at
) VALUES (
  gen_random_uuid(),
  'Legacy-ai',
  'WEEKLY FINANCIAL TASKS:
• Upload weekly subcontractors invoices for approval: Every Monday
• Enter receipts: bank account, CC, lines of credits
• Enter new subs and employees direct deposits and info into Quickbooks & Payroll
• Enter paid subcontractor invoices into Quickbooks
• Payroll for direct deposit subcontractors
• Bill Pay for Subcontractors
• Payroll for Employees
• Enter new budgets (sales)
• Enter change orders
• Enter time sheets
• Export Payroll Transactions
• Download bank transactions
• Enter customer payments in Quickbooks
• Pay Operating invoices
• Profit first transfers
• Process payroll tax payments
• Release client invoices
• Numbers in ninety weekly

MONTHLY FINANCIAL TASKS:
• Reconcile all bank accounts
• Reconcile Lines of Credits
• Reconcile Credit cards
• Provide missing transactions report
• Pay Project Manager bonus
• Process payroll tax payments
• Process payroll reports
• Overall reporting: profit and loss, balance sheet, forecasting, operation budget vs actual
• Supply job actual vs estimates as necessary
• Monthly finance leadership meeting
• Submit monthly workers comp

QUARTERLY FINANCIAL TASKS:
• Process any quarterly tax reports and payments

YEARLY FINANCIAL TASKS:
• Submit end of the year payroll taxes and reports
• Process end of the year 1099s
• Process end of the year W2s
• Workers comp and General insurance audits',
  'Financial',
  'Financial Software',
  'text-based',
  '{"title": "Financial Tasks Schedule", "source": "Legacy Decks Academy Operations Manual"}',
  NOW()
);

-- 2. Receipt Management Playbook
INSERT INTO knowledge_chunks (
  id,
  gpt_id,
  content,
  category,
  subcategory,
  processing_method,
  metadata,
  created_at
) VALUES (
  gen_random_uuid(),
  'Legacy-ai',
  'LEGACY DECKS RECEIPT MANAGEMENT PLAYBOOK

PURPOSE:
To ensure a streamlined and accurate process for managing receipts related to material purchases, allowing for proper job costing and financial tracking.

TEAM MEMBERS APPROVED FOR PURCHASES:
• Project Managers
• Operations Managers
• Other approved team members

STEPS FOR HANDLING RECEIPTS:

1. CAPTURING THE RECEIPT:
Upon purchasing materials, the person responsible must either:
• Take a clear photo of the receipt using their smartphone
• Use a scanning app to generate a PDF or image of the receipt

2. UPLOADING THE RECEIPT:
• The receipt must be uploaded to the shared Dropbox folder (Google Drive can also be used as an alternative)
• Ensure the upload is done immediately after the purchase to avoid loss or delay in processing

3. FILE NAMING CONVENTION:
Each file must follow the specific naming format to ensure easy organization and retrieval for job costing and financial reporting. The file name should include:
• Vendor or Supplier Name: The company where the materials were purchased (e.g., Home Depot, Lowes)
• Classification of Materials: Use one of the following classifications:
  - Framing
  - Railing
  - Decking
  - Fasteners
  - Miscellaneous
• Customer Name: The last name of the customer whose project the materials were purchased for
• Dollar Value Charged: The total amount spent on the receipt, including tax
• Date Purchased: The date of purchase in the format MM-DD-YYYY

EXAMPLE FILE NAME:
HomeDepot_Materials_Jones_$150_10-01-2024

4. PROCESSING THE RECEIPTS:
BOOKKEEPER''S RESPONSIBILITY:
• The bookkeeper will check the shared folder weekly (or daily if possible) and apply each receipt to the appropriate job in QuickBooks
• The bookkeeper must ensure each receipt is assigned to the correct job and cost code for accurate financial tracking

5. DISPOSAL OF RECEIPTS:
Once the receipt has been uploaded and processed, the physical copy of the receipt can be discarded (thrown away)

KEY POINTS FOR TEAM MEMBERS:
• Timely Upload: Receipts must be uploaded immediately after the purchase is made to avoid loss or delay
• Accurate Naming: Always follow the naming format to ensure proper organization in the system
• Receipts Classification: All receipts related to materials should be broadly classified under "Materials" for job costing purposes',
  'Financial',
  'Job Costing',
  'text-based',
  '{"title": "Receipt Management Playbook", "source": "Legacy Decks Academy Operations Manual"}',
  NOW()
);

-- 3. QuickBooks Items List
INSERT INTO knowledge_chunks (
  id,
  gpt_id,
  content,
  category,
  subcategory,
  processing_method,
  metadata,
  created_at
) VALUES (
  gen_random_uuid(),
  'Legacy-ai',
  'QUICKBOOKS ITEMS LIST FOR JOB COSTING

LABOR ITEMS:
• Aluminum Wall Install Labor
• Deck Demo Labor
• Decking Install Labor
• Electric Install Labor
• Fireplace Install Labor
• Footing Install Labor
• Framing Install Labor
• Gutter Install Labor
• HVAC Labor
• Masonry Install Labor
• Plumbing Labor
• Railing Install Labor
• Roofing Install Labor
• Siding Install Labor
• Under Decking Install Labor

SUBCONTRACTOR ITEMS:
• Aluminum Wall Install Subcontract
• Counter Top Install Subcontract
• Deck Demo Subcontract
• Decking Install Subcontract
• Drywall Install Subcontract
• Electric Install Subcontract
• Excavation Subcontract
• Fireplace Install Subcontract
• Footing Install Subcontract
• Foundation Subcontract
• Framing Install Subcontract
• Gas Line Install
• Grading Subcontract
• Gutter Install Subcontract
• HVAC Subcontract
• Irrigation Subcontract
• Landscaping Subcontract
• Masonry Install Subcontract
• Paint Subcontract
• Plumbing Subcontract
• Railing Install Subcontract
• Roofing Install Subcontract
• Siding Install Subcontract
• Stain Contract
• Under Decking Install Subcontract

MATERIAL ITEMS:
• Aluminum Wall Material
• Decking Material
• Drywall Material
• Electric Fixtures
• Electric Material
• Fill Material
• Fireplace Material
• Foundation Material
• Framing Material
• Gutter Material
• HVAC Material
• Landscaping Material
• Masonry Material
• Paint Material
• Plumbing Fixtures
• Plumbing Material
• Railing Material
• Roofing Material
• Siding Material
• Stain Material
• Under Decking Material

OTHER JOB COST ITEMS:
• Building Permits
• Dumpster
• Engineering
• Equipment Rental
• Exterminator
• Portable Toilet
• Prints, Drawings, Rendition

All items are configured as Service type with appropriate income/expense accounts for accurate job costing and financial reporting.',
  'Financial',
  'Job Costing',
  'text-based',
  '{"title": "QuickBooks Items List", "source": "Legacy Decks Academy Operations Manual"}',
  NOW()
);
