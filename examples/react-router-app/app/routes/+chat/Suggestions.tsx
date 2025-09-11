import {
  Suggestion,
  Suggestions as SuggestionsContainer,
} from '~/components/ai-elements/suggestion'
import { suggestions } from './data'
import { useAdaptedStore } from './storeBridge'

export const ChatSuggestions = () => {
  const { store, sendMessage } = useAdaptedStore()
  const status = store.use.status()

  return (
    <SuggestionsContainer className='px-4'>
      {suggestions.map((suggestion) => (
        <Suggestion
          key={suggestion}
          onClick={() => {
            if (['submitted', 'streaming'].includes(status)) return
            sendMessage({
              text: suggestion,
            })
          }}
          suggestion={suggestion}
        />
      ))}
    </SuggestionsContainer>
  )
}
