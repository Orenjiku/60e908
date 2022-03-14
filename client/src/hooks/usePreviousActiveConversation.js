import { useEffect, useRef } from 'react';

const usePreviousActiveConversation = (conversation) => {
    const ref = useRef(conversation);
    useEffect(() => {
        ref.current = conversation;
    }, [conversation]);
    return ref.current;
  }

  export default usePreviousActiveConversation;