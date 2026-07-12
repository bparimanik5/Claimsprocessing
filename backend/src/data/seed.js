// In-memory seed data for the Claims Processing sample application.
// Domain: Protection policies (Life Cover, Critical Illness, Income Protection, Terminal Illness).

let idCounter = 1000;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

const users = [
  { id: 'U-1', username: 'handler', password: 'handler123', name: 'Priya Nair', role: 'handler' },
  { id: 'U-2', username: 'adjudicator', password: 'adjudicator123', name: 'Rahul Mehta', role: 'adjudicator' },
  { id: 'U-3', username: 'admin', password: 'admin123', name: 'System Admin', role: 'admin' },
];

const policies = [
  {
    id: 'POL-1001',
    policyNumber: 'PRT-100234',
    holderName: 'Ananya Sharma',
    holderDob: '1985-03-12',
    productType: 'Life Cover',
    sumAssured: 5000000,
    premium: 12500,
    status: 'Active',
    startDate: '2019-06-01',
    nominee: 'Rohit Sharma',
  },
  {
    id: 'POL-1002',
    policyNumber: 'PRT-100567',
    holderName: 'Vikram Singh',
    holderDob: '1978-11-23',
    productType: 'Critical Illness',
    sumAssured: 2000000,
    premium: 8200,
    status: 'Active',
    startDate: '2021-01-15',
    nominee: 'Meera Singh',
  },
  {
    id: 'POL-1003',
    policyNumber: 'PRT-100812',
    holderName: 'Fatima Khan',
    holderDob: '1990-07-04',
    productType: 'Income Protection',
    sumAssured: 3000000,
    premium: 9800,
    status: 'Active',
    startDate: '2020-09-10',
    nominee: 'Imran Khan',
  },
  {
    id: 'POL-1004',
    policyNumber: 'PRT-101045',
    holderName: 'Suresh Iyer',
    holderDob: '1965-02-28',
    productType: 'Terminal Illness',
    sumAssured: 4000000,
    premium: 15600,
    status: 'Lapsed',
    startDate: '2015-04-18',
    nominee: 'Lakshmi Iyer',
  },
  {
    id: 'POL-1005',
    policyNumber: 'PRT-101299',
    holderName: 'Emma Wilson',
    holderDob: '1982-12-01',
    productType: 'Life Cover',
    sumAssured: 6000000,
    premium: 14200,
    status: 'Active',
    startDate: '2022-03-22',
    nominee: 'James Wilson',
  },
  {
    id: 'POL-1006',
    policyNumber: 'PRT-101523',
    holderName: 'David Chen',
    holderDob: '1975-08-19',
    productType: 'Life Cover',
    sumAssured: 3500000,
    premium: 11000,
    status: 'Active',
    startDate: '2023-05-01',
    // NOTE: nominee intentionally absent -- this record was carried over
    // from the legacy policy admin migration (Jan 2023) without nominee
    // capture. Data-quality backlog item DQ-4471 tracks backfilling these.
  },
];

const CLAIM_TYPES = ['Death', 'Critical Illness', 'Income Protection', 'Terminal Illness'];
const CLAIM_STATUSES = [
  'Submitted',
  'Under Review',
  'Additional Info Requested',
  'Approved',
  'Rejected',
  'Paid',
];

const claims = [
  {
    id: 'CLM-5001',
    claimNumber: 'CLM-2026-0001',
    policyId: 'POL-1002',
    claimType: 'Critical Illness',
    claimantName: 'Vikram Singh',
    dateOfIncident: '2026-05-02',
    description: 'Diagnosed with a covered critical illness condition. Hospitalized for treatment.',
    amountClaimed: 2000000,
    amountApproved: null,
    status: 'Under Review',
    submittedDate: '2026-05-10',
    documents: [
      { id: 'DOC-1', name: 'diagnosis_report.pdf', uploadedDate: '2026-05-10' },
      { id: 'DOC-2', name: 'hospital_bills.pdf', uploadedDate: '2026-05-10' },
    ],
    history: [
      { status: 'Submitted', date: '2026-05-10', by: 'Priya Nair', comment: 'Claim submitted by handler.' },
      { status: 'Under Review', date: '2026-05-11', by: 'Rahul Mehta', comment: 'Reviewing medical documentation.' },
    ],
  },
  {
    id: 'CLM-5002',
    claimNumber: 'CLM-2026-0002',
    policyId: 'POL-1003',
    claimType: 'Income Protection',
    claimantName: 'Fatima Khan',
    dateOfIncident: '2026-04-15',
    description: 'Unable to work due to a covered disability. Requesting monthly income benefit.',
    amountClaimed: 250000,
    amountApproved: 250000,
    status: 'Approved',
    submittedDate: '2026-04-20',
    documents: [
      { id: 'DOC-3', name: 'medical_certificate.pdf', uploadedDate: '2026-04-20' },
    ],
    history: [
      { status: 'Submitted', date: '2026-04-20', by: 'Priya Nair', comment: 'Claim submitted by handler.' },
      { status: 'Under Review', date: '2026-04-22', by: 'Rahul Mehta', comment: 'Verifying disability assessment.' },
      { status: 'Approved', date: '2026-04-28', by: 'Rahul Mehta', comment: 'Approved for full claimed amount.' },
    ],
  },
  {
    id: 'CLM-5003',
    claimNumber: 'CLM-2026-0003',
    policyId: 'POL-1001',
    claimType: 'Death',
    claimantName: 'Rohit Sharma',
    dateOfIncident: '2026-03-01',
    description: 'Death claim filed by nominee following the sudden passing of the policyholder.',
    amountClaimed: 5000000,
    amountApproved: null,
    status: 'Additional Info Requested',
    submittedDate: '2026-03-05',
    documents: [
      { id: 'DOC-4', name: 'death_certificate.pdf', uploadedDate: '2026-03-05' },
    ],
    history: [
      { status: 'Submitted', date: '2026-03-05', by: 'Priya Nair', comment: 'Claim submitted by handler.' },
      { status: 'Under Review', date: '2026-03-06', by: 'Rahul Mehta', comment: 'Reviewing submitted documents.' },
      {
        status: 'Additional Info Requested',
        date: '2026-03-08',
        by: 'Rahul Mehta',
        comment: 'Requesting post-mortem report and nominee ID proof.',
      },
    ],
  },
];

module.exports = {
  users,
  policies,
  claims,
  CLAIM_TYPES,
  CLAIM_STATUSES,
  nextId,
};
