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

    Promise.all([
      fetch("/api/twitch/moderated-channels").then(r => r.json()).catch(() => []),
      fetch(`/api/twitch/users?id=${user.user_id}`).then(r => r.json()).catch(() => []),
    ]).then(([modData, userData]) => {
      const modList: Channel[] = Array.isArray(modData) ? modData : [];
      const ownRaw = Array.isArray(userData) && userData[0] ? userData[0] : null;

      let combined = [...modList];
      if (ownRaw) {
        const ownChannel: Channel = {
          broadcaster_id: ownRaw.id,
          broadcaster_login: ownRaw.login,
          broadcaster_name: ownRaw.display_name,
        };
        // Prepend own channel if not already present
        if (!combined.some(c => c.broadcaster_id === ownChannel.broadcaster_id)) {
          combined = [ownChannel, ...combined];
        }
      }

      setChannels(combined);
      if (combined.length > 0) setSelectedChannel(combined[0]);
    }).finally(() => setLoading(false));
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
