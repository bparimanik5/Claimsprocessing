import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function ClaimCard({ claim }) {
  return (
    <tr data-testid={`claim-row-${claim.claimNumber}`}>
      <td>{claim.claimNumber}</td>
      <td>{claim.claimantName}</td>
      <td>{claim.claimType}</td>
      <td>{claim.policyNumber}</td>
      <td>₹{claim.amountClaimed.toLocaleString('en-IN')}</td>
      <td><StatusBadge status={claim.status} /></td>
      <td>{claim.submittedDate}</td>
      <td>
        <Link to={`/claims/${claim.id}`} data-testid={`view-claim-${claim.claimNumber}`}>
          View
        </Link>
      </td>
    </tr>
  );
}
