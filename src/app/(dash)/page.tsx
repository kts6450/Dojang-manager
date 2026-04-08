import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import Branch from "@/lib/db/models/Branch";
import { Header } from "@/components/shared/Header";
import { HQDashboard } from "@/components/dashboard/HQDashboard";
import { BranchDashboard } from "@/components/dashboard/BranchDashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role;

  let branchName: string | undefined;
  if (role === "BRANCH_ADMIN" && session.user.branchId) {
    await connectDB();
    const branch = await Branch.findById(session.user.branchId).lean();
    branchName = branch?.name;
  }

  return (
    <>
      <Header title="Dashboard" />
      {role === "HQ_ADMIN" ? (
        <HQDashboard />
      ) : (
        <BranchDashboard branchName={branchName} />
      )}
    </>
  );
}
