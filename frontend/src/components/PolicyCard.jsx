import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function PolicyCard({ policy }) {
  return (
    <div className="card" data-testid={`policy-card-${policy.policyNumber}`}>
      <div className="card-header">
        <strong>{policy.policyNumber}</strong>
        <StatusBadge status={policy.status} />
      </div>
      <div className="card-body">
        <div>Holder: {policy.holderName}</div>
        <div>Product: {policy.productType}</div>
        <div>Sum Assured: ₹{policy.sumAssured.toLocaleString('en-IN')}</div>
        <div>Start Date: {policy.startDate}</div>
      </div>
      <div className="card-footer">
        <Link
          to={`/claims/new?policyId=${policy.id}`}
          data-testid={`file-claim-${policy.policyNumber}`}
          className="btn btn-primary"
        >
          File a Claim
        </Link>
      </div>
    </div>
  );
}
