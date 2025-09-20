import { useCallback, useReducer } from 'react';

type UseInputsAction = {
  name: string;
  value: string | number | boolean;
};

function reducer<T>(state: T, action: UseInputsAction | null) {
  if (!action) {
    const initialState: any = {};
    Object.keys(state!).forEach((key) => {
      initialState[key] = '';
    });
    return initialState;
  }
  return {
    ...state,
    [action.name]: action.value,
  };
}

export default function useFilters<T>(defaultValues: T) {
  const [state, dispatch] = useReducer(reducer, defaultValues);
  const onChange = useCallback((e: any, value: unknown) => {
    // input event
    if (e instanceof Function) {
      dispatch({
        name: e.target.name,
        value: e.target.value,
      });
    } else {
      // select event
      dispatch({
        name: e,
        value: value as string | number | boolean, // 타입 단언 추가
      });
    }
  }, []);
  const onReset = useCallback(() => {
    dispatch(null);
  }, []);
  return [state, onChange, onReset, dispatch] as [T, typeof onChange, typeof onReset, typeof dispatch];
}
