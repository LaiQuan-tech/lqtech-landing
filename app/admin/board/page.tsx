import AdminHeader from "@/components/admin/AdminHeader";
import CaseBoard from "@/components/admin/CaseBoard";
import { getCasesForBoard } from "@/lib/adminCases";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** 進度看板：手機可左右滑動瀏覽各案件進度（scroll-snap 輪播）。 */
export default async function BoardPage() {
  const cases = await getCasesForBoard();

  return (
    <>
      <AdminHeader />
      <main className="gt-admin-shell">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1d1d1f", margin: "0 0 6px" }}>進度看板</h1>
        <p style={{ fontSize: 14.5, color: "#86868b", margin: "0 0 22px", lineHeight: 1.6 }}>
          手機可左右滑動瀏覽各案件進度；點狀態藥丸即可快速更新。
        </p>
        <CaseBoard cases={cases} />
      </main>
    </>
  );
}
