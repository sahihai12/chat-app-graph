import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';

const GET_MESSAGES = gql`
  query GetMessages {
    getMessages {
      id
      text
      sender
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($text: String!) {
    sendMessage(text: $text) {
      id
      text
      sender
    }
  }
`;

function Chat() {
  const { data, loading, error } = useQuery(GET_MESSAGES);
  const [text, setText] = useState('');
  const [sendMessage] = useMutation(SEND_MESSAGE, {
    update: (cache, { data: { sendMessage } }) => {
      const existingMessages = cache.readQuery({ query: GET_MESSAGES });
      cache.writeQuery({
        query: GET_MESSAGES,
        data: { getMessages: [...existingMessages.getMessages, sendMessage] },
      });
    },
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await sendMessage({ variables: { text } });
      setText(''); // Clear the input field after sending a message
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="chat-container">
      <h2>Chat Room</h2>
      <div className="messages">
        {data.getMessages.map((message) => (
          <div key={message.id} className="message">
            <strong>{message.sender}:</strong> {message.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your message"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default Chat;
