import AuthGuard from "@/components/auth-guard";
export default function Todos() {
  return (
    <>
      <AuthGuard>
        <h1>Todos Page</h1>
      </AuthGuard>
    </>
  );
}
