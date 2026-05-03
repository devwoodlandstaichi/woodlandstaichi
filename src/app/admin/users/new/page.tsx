import { requireAdmin } from "@/lib/auth/dal";
import { PageHeader } from "@/components/admin/ui";
import { UserForm } from "./user-form";

export const metadata = { title: "Invite user" };

export default async function NewUserPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Invite user"
        description="Create a staff account. They'll be able to sign in immediately with the password you set; they can change it via Forgot password."
        back="/admin/users"
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
        <UserForm />
      </div>
    </>
  );
}
