import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    markAsRead, // 👈 thêm hàm này trong store
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col">
      {/* HEADER */}
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Danh bạ</span>
        </div>

        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Chỉ hiển thị Online</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>

      {/* USER LIST */}
      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => {
          const isUnread = user.unreadCount > 0;
          const lastMessageText = user.lastMessage
            ? user.lastMessage.text
              ? user.lastMessage.text
              : "📷 Hình ảnh"
            : "Chưa có tin nhắn";

          return (
            <button
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                markAsRead(user._id); // 👈 click là xem
              }}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${
                  selectedUser?._id === user._id
                    ? "bg-base-300 ring-1 ring-base-300"
                    : ""
                }
              `}
            >
              {/* AVATAR */}
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full"
                />

                {/* ONLINE DOT */}
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900" />
                )}
              </div>

              {/* USER INFO */}
              <div className="hidden lg:flex flex-col text-left min-w-0 flex-1">
                <div className="font-medium truncate">
                  {user.fullName}
                </div>

                <div
                  className={`text-sm truncate ${
                    isUnread
                      ? "font-semibold text-zinc-100"
                      : "text-zinc-400"
                  }`}
                >
                  {lastMessageText}
                </div>
              </div>

              {/* UNREAD BADGE */}
              {isUnread && (
                <span className="hidden lg:inline-flex bg-emerald-500 text-black 
                text-xs font-semibold rounded-full px-2 py-0.5">
                  {user.unreadCount}
                </span>
              )}
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">
            Không có người dùng nào
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
