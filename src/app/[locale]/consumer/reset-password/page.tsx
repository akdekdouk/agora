import { redirect } from "@/i18n/navigation";

// Redirect to forgot-password which handles the full flow
export default function ConsumerResetPasswordPage() {
  redirect("/consumer/forgot-password");
}
