
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/ChatArea";
import { Header } from "@/components/Header";
import { AuthComponent } from "@/components/AuthComponent";
import { ChatProvider, useChatContext } from "@/contexts/ChatContext";
import { NotionSelectionProvider } from "@/contexts/NotionSelectionContext";

function AppContent() {
  const { user, loading } = useChatContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Ładowanie aplikacji...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthComponent />;
  }

  return (
    <NotionSelectionProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <Header />
            <main className="flex-1 flex flex-col overflow-hidden">
              <ChatArea />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </NotionSelectionProvider>
  );
}

const Index = () => {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
};

export default Index;
