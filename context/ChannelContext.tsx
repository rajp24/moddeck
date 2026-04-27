"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export interface Channel {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
}

interface ChannelContextType {
  channels: Channel[];
  loading: boolean;
  selectedChannel: Channel | null;
  setSelectedChannel: (ch: Channel | null) => void;
  allChannels: Channel[];
}

const ChannelContext = createContext<ChannelContextType>({
  channels: [],
  loading: true,
  selectedChannel: null,
  setSelectedChannel: () => {},
  allChannels: [],
});

export function ChannelProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch("/api/twitch/moderated-channels")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setChannels(list);
        if (list.length > 0) setSelectedChannel(list[0]);
      })
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <ChannelContext.Provider value={{
      channels,
      loading,
      selectedChannel,
      setSelectedChannel,
      allChannels: channels,
    }}>
      {children}
    </ChannelContext.Provider>
  );
}

export const useChannels = () => useContext(ChannelContext);
