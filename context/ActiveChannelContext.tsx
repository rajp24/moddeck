"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Channel, useChannels } from "./ChannelContext";

interface ActiveChannelContextType {
  activeChannel: Channel | null;
  setActiveChannel: (ch: Channel | null) => void;
}

const ActiveChannelContext = createContext<ActiveChannelContextType>({
  activeChannel: null,
  setActiveChannel: () => {},
});

export function ActiveChannelProvider({ children }: { children: React.ReactNode }) {
  const { channels } = useChannels();
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  // Seed from first channel once channels load, or if the active one was removed
  useEffect(() => {
    if (channels.length === 0) return;
    setActiveChannel(prev => {
      if (!prev) return channels[0];
      // Keep the existing selection if it's still in the list
      const stillExists = channels.some(c => c.broadcaster_id === prev.broadcaster_id);
      return stillExists ? prev : channels[0];
    });
  }, [channels]);

  return (
    <ActiveChannelContext.Provider value={{ activeChannel, setActiveChannel }}>
      {children}
    </ActiveChannelContext.Provider>
  );
}

export const useActiveChannel = () => useContext(ActiveChannelContext);
