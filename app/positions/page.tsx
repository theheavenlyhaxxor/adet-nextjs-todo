import AuthGuard from "@/components/auth-guard";
export default function Positions() {
  return (
    <>
      <AuthGuard>
        <h1>Position Page</h1>
      </AuthGuard>
    </>
  );
}
