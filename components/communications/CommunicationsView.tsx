import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Megaphone, Send, FileText } from "lucide-react";
import { MessagesPanel } from "./MessagesPanel";
import { AnnouncementsPanel } from "./AnnouncementsPanel";
import { BulkSendPanel } from "./BulkSendPanel";
import { TemplatesPanel } from "./TemplatesPanel";

export function CommunicationsView() {
  return (
    <div className="space-y-4">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Communications & Messagerie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="messages" className="w-full">
            <TabsList className="flex flex-wrap h-auto justify-start gap-1">
              <TabsTrigger value="messages" className="gap-2">
                <MessageSquare className="w-4 h-4" /> Messagerie
              </TabsTrigger>
              <TabsTrigger value="announcements" className="gap-2">
                <Megaphone className="w-4 h-4" /> Annonces
              </TabsTrigger>
              <TabsTrigger value="bulk" className="gap-2">
                <Send className="w-4 h-4" /> Envois massifs
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <FileText className="w-4 h-4" /> Modèles
              </TabsTrigger>
            </TabsList>
            <TabsContent value="messages" className="mt-6">
              <MessagesPanel />
            </TabsContent>
            <TabsContent value="announcements" className="mt-6">
              <AnnouncementsPanel />
            </TabsContent>
            <TabsContent value="bulk" className="mt-6">
              <BulkSendPanel />
            </TabsContent>
            <TabsContent value="templates" className="mt-6">
              <TemplatesPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
