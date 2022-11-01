import React, { useState } from 'react';
import { gql, useQuery, useSubscription, useMutation } from '@apollo/client';
import './TodoApp.scss';

const TODOS_SUBSCRIPTION = gql`
  subscription TodosSubscription {
    todo(order_by: {id: asc}) {
      id
      title
      completed
    }
  }
`;

const GET_TODOS = gql`
  query GetTodos {
    todo(order_by: {id: asc}) {
      id
      title
      completed
    }
  }
`;

const ADD_TODO = gql`
  mutation AddTodo($title: String!) {
    insert_todo_one(object: { title: $title }) {
      id
      title
      completed
    }
  }
`;

const SET_TODO_COMPLETED = gql`
  mutation ToggleTodoCompleted($id: Int!, $completed: Boolean!) {
    update_todo_by_pk(pk_columns: { id: $id }, _set: { completed: $completed }) {
      id
      completed
    }
  }
`;

interface Todo {
  id: number,
  title: string,
  completed: boolean
};

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [skipQuery, setSkipQuery] = useState(false);
  const [addTodo] = useMutation(ADD_TODO, { onCompleted: (data) => {
    setTodos([...todos, data.insert_todo_one]);
  } });
  const [setTodoCompleted] = useMutation(SET_TODO_COMPLETED, { onCompleted: (data) => {
    const todo = todos.find((todo) => todo.id === data.update_todo_by_pk.id);
    if (todo) {
      todo.completed = data.update_todo_by_pk.completed;
      setTodos(todos);
    }
  } });
  const { loading } = useQuery(GET_TODOS, {
    onCompleted: (data) => {
      /**
       * onCompleted seems to be triggered multiple times, whereas I would expect it to only
       * trigger when the query is actually performed. Using the `skip` option on the query
       * and additional state, we can force the behavior that it will only be executed once.
       *
       * This seems to be a known issue, addressed in the upcoming 3.8 release with this PR:
       * https://github.com/apollographql/apollo-client/pull/10229
       */
      setSkipQuery(true);
      setTodos(data.todo);
    },
    skip: skipQuery
  });
  useSubscription(
    TODOS_SUBSCRIPTION,
    { onData: ({ data }) => setTodos(data.data.todo) }
  );

  return (
    <div className="TodoApp">
      <h1>Todos</h1>
      {loading && <p>Loading...</p>}
      {! loading && todos.length === 0 && <p>No todos yet</p>}
      {todos.length > 0 && (
        <ul>
          {todos.map((todo: Todo) => (
            <li key={todo.id} className={todo.completed ? 'completed' : ''}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={(ev) => {
                  setTodoCompleted({ variables: { id: todo.id, completed: ev.target.checked } });
                }}
              />
              {todo.title}
            </li>
          ))}
        </ul>
      )}
      <div className="addRow">
        <input
          type="text"
          value={title}
          onInput={(ev) => {
            setTitle(ev.currentTarget.value);
          }}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' && title.trim().length > 0) {
              addTodo({ variables: { title } });
              setTitle('');
            }
          }}
        />
        <button
          disabled={title.trim().length < 1}
          onClick={() => {
            addTodo({ variables: { title }});
            setTitle('');
          }}
        >Add Todo</button>
      </div>
    </div>
  );
}

export default TodoApp;
