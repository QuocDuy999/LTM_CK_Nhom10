import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  /* ===================== USERS ===================== */
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");

      // đảm bảo user nào cũng có unreadCount + lastMessage
      const usersWithDefaults = res.data.map((u) => ({
        ...u,
        unreadCount: u.unreadCount || 0,
        lastMessage: u.lastMessage || null,
      }));

      set({ users: usersWithDefaults });
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi tải users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /* ===================== MESSAGES ===================== */
  getMessages: async (userId) => {
  set({ isMessagesLoading: true });
  try {
    const res = await axiosInstance.get(`/messages/${userId}`);
    const messages = res.data;

    set({ messages });

    // 🔥 FIX QUAN TRỌNG NHẤT
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];

      set((state) => ({
        users: state.users.map((u) =>
          u._id === userId
            ? {
                ...u,
                lastMessage: lastMsg,
              }
            : u
        ),
      }));
    }

    // reset unread
    get().markAsRead(userId);
  } catch (error) {
    toast.error(error.response?.data?.message || "Lỗi tải tin nhắn");
  } finally {
    set({ isMessagesLoading: false });
  }
},


  sendMessage: async (messageData) => {
    const { selectedUser, messages, users } = get();

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      // thêm vào khung chat
      set({ messages: [...messages, res.data] });

      // cập nhật lastMessage ở sidebar
      set({
        users: users.map((u) =>
          u._id === selectedUser._id
            ? {
                ...u,
                lastMessage: res.data,
              }
            : u
        ),
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Gửi tin nhắn lỗi");
    }
  },

  /* ===================== SOCKET ===================== */
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages, users } = get();

      const isChatOpen =
        selectedUser && newMessage.senderId === selectedUser._id;

      // đang mở đúng cuộc chat
      if (isChatOpen) {
        set({ messages: [...messages, newMessage] });
      }

      // cập nhật sidebar
      set({
        users: users.map((u) => {
          if (u._id !== newMessage.senderId) return u;

          return {
            ...u,
            lastMessage: newMessage,
            unreadCount: isChatOpen ? 0 : (u.unreadCount || 0) + 1,
          };
        }),
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  /* ===================== READ ===================== */
  markAsRead: (userId) => {
    set((state) => ({
      users: state.users.map((u) =>
        u._id === userId ? { ...u, unreadCount: 0 } : u
      ),
    }));
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
