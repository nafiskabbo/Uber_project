let socket = null;

export const wsService = {
  // connect ফাংশনে এখন driverName নেওয়া হচ্ছে
  connect: (driverName, onMessageReceived) => {
    socket = new WebSocket("ws://127.0.0.1:8000/ws/chat");

    socket.onopen = () => {
      console.log("Driver WebSocket Connected!");
      // কানেক্ট হওয়া মাত্রই ব্যাকএন্ডের ডিকশনারিতে ড্রাইভারের নাম রেজিস্টার করা 🚀
      socket.send(JSON.stringify({ name: driverName }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessageReceived(data);
    };

    socket.onclose = () => {
      console.log("Driver WebSocket Closed!");
    };
  },

  sendMessage: (payload) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  },

  disconnect: () => {
    if (socket) {
      socket.close();
    }
  }
};