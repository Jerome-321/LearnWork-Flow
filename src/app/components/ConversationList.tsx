import { MessageCircle, Check, CheckCheck } from "lucide-react";

interface Message {
  id: string;
  name: string;
  avatar: string;
  platform: "whatsapp" | "facebook" | "sms" | "instagram";
  lastMessage: string;
  time: string;
  unread: number;
  read: boolean;
  online?: boolean;
}

const platformColors = {
  whatsapp: "bg-green-500",
  facebook: "bg-blue-600",
  sms: "bg-gray-500",
  instagram: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500",
};

const platformIcons = {
  whatsapp: "W",
  facebook: "f",
  sms: "📱",
  instagram: "📷",
};

const mockConversations: Message[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "SJ",
    platform: "whatsapp",
    lastMessage: "Hey! Are we still on for the meeting tomorrow?",
    time: "2:34 PM",
    unread: 2,
    read: false,
    online: true,
  },
  {
    id: "2",
    name: "Mike Chen",
    avatar: "MC",
    platform: "facebook",
    lastMessage: "Thanks for the update! I'll review it tonight.",
    time: "1:15 PM",
    unread: 0,
    read: true,
  },
  {
    id: "3",
    name: "Emma Williams",
    avatar: "EW",
    platform: "instagram",
    lastMessage: "Love the new photos! 😍",
    time: "12:45 PM",
    unread: 5,
    read: false,
    online: true,
  },
  {
    id: "4",
    name: "James Brown",
    avatar: "JB",
    platform: "sms",
    lastMessage: "Can you send me the document?",
    time: "11:20 AM",
    unread: 0,
    read: true,
  },
  {
    id: "5",
    name: "Lisa Anderson",
    avatar: "LA",
    platform: "whatsapp",
    lastMessage: "Perfect! See you then.",
    time: "Yesterday",
    unread: 0,
    read: true,
  },
  {
    id: "6",
    name: "David Martinez",
    avatar: "DM",
    platform: "facebook",
    lastMessage: "That sounds like a great plan!",
    time: "Yesterday",
    unread: 1,
    read: false,
  },
  {
    id: "7",
    name: "Rachel Kim",
    avatar: "RK",
    platform: "instagram",
    lastMessage: "Check out my latest post!",
    time: "2 days ago",
    unread: 0,
    read: true,
    online: true,
  },
  {
    id: "8",
    name: "Tom Wilson",
    avatar: "TW",
    platform: "sms",
    lastMessage: "Got it, thanks!",
    time: "2 days ago",
    unread: 0,
    read: true,
  },
];

export function ConversationList() {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <p className="text-sm text-gray-500 mt-1">8 conversations</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white px-6 py-3 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full px-4 py-2.5 pl-10 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Conversation Cards */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {mockConversations.map((conversation) => (
          <div
            key={conversation.id}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 hover:border-blue-200"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {conversation.avatar}
                </div>
                {conversation.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                )}
                {/* Platform Badge */}
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${platformColors[conversation.platform]} border-2 border-white`}
                >
                  {platformIcons[conversation.platform]}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {conversation.name}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {conversation.time}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-gray-600 truncate flex-1">
                    {conversation.read && (
                      <CheckCheck className="inline w-3.5 h-3.5 text-blue-500 mr-1" />
                    )}
                    {conversation.lastMessage}
                  </p>
                  {conversation.unread > 0 && (
                    <span className="flex-shrink-0 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}