import React from 'react';
import { ApolloProvider } from '@apollo/client';
import client from './apolloClient';
import Signup from './components/Signup';
import Login from './components/Login';
import Chat from './components/Chat';

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem('token'));

  return (
    <ApolloProvider client={client}>
      <div className="App">
        {!isLoggedIn ? (
          <>
            <Signup setIsLoggedIn={setIsLoggedIn} />
            <Login setIsLoggedIn={setIsLoggedIn} />
          </>
        ) : (
          <Chat />
        )}
      </div>
    </ApolloProvider>
  );
}

export default App;
