export interface PalworldPlayer {
  name: string;
  playerId: string;
  userId: string;
  ip: string;
}

export interface PalworldPlayerResponse {
  players: PalworldPlayer[];
}

export interface PalworldServerInfoResponse {
  version: string;
  servername: string;
  description: string;
  worldguid: string;
}
