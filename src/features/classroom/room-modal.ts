import { roomService } from './room-service.ts';

export function openRoomModal(): void {
  const modal = document.getElementById('roomModalOverlay');
  if (!modal) return;
  modal.style.display = 'flex';

  const nameInput = document.getElementById('roomInputUserName') as HTMLInputElement;
  const roomInput = document.getElementById('roomInputRoomId') as HTMLInputElement;
  const curState = roomService.getState();

  if (nameInput && !nameInput.value && curState.userName) {
    nameInput.value = curState.userName;
  }
  if (roomInput && !roomInput.value && curState.roomId) {
    roomInput.value = curState.roomId;
  }

  if (nameInput) setTimeout(() => nameInput.focus(), 80);
}

export function closeRoomModal(): void {
  const modal = document.getElementById('roomModalOverlay');
  if (modal) modal.style.display = 'none';
}

export function handleJoinClick(): void {
  const nameInput = document.getElementById('roomInputUserName') as HTMLInputElement;
  const roomInput = document.getElementById('roomInputRoomId') as HTMLInputElement;
  const name = nameInput?.value.trim();
  const room = roomInput?.value.trim();

  if (!name || !room) {
    alert('Lütfen adınızı ve oda adını girin.');
    return;
  }

  roomService.joinOrCreateRoom(room, name, false);
  closeRoomModal();
}

export function handleCreateClick(): void {
  const nameInput = document.getElementById('roomInputUserName') as HTMLInputElement;
  const roomInput = document.getElementById('roomInputRoomId') as HTMLInputElement;
  const name = nameInput?.value.trim();
  const room = roomInput?.value.trim();

  if (!name || !room) {
    alert('Lütfen adınızı ve oluşturulacak oda adını girin.');
    return;
  }

  roomService.joinOrCreateRoom(room, name, true);
  closeRoomModal();
}
