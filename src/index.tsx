import React from 'react';
import ReactDOM from 'react-dom/client';
import { split, HttpLink, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import './index.scss';
import TodoApp from './TodoApp';

const httpLink = new HttpLink({
  uri: 'https://todo-test-api.devcraft.co/v1/graphql'
});

const wsLink = new GraphQLWsLink(createClient({
  url: 'wss://todo-test-api.devcraft.co/v1/graphql'
}));

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <TodoApp />
    </ApolloProvider>
  </React.StrictMode>
);
