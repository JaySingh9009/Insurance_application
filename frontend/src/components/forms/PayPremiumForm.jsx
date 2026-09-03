import RazorpayCheckoutModal from "../common/RazorpayCheckoutModal";

export default function PayPremiumForm({ policy, isOpen, onClose, onSuccess }) {
  if (!isOpen || !policy) return null;

  return (
    <RazorpayCheckoutModal
      policy={policy}
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
