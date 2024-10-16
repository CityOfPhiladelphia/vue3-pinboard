
import en from './en-us';
import es from './es';
import ch from './ch';
import vi from './vi';
import ru from './ru';
import fr from './fr';

export default {
  i18n: {
    languages: [
      {
        language: 'en-US',
        title: 'English',
      },
      {
        language: 'es',
        title: 'Español',
      },
    ],
    data: {
      locale: 'en-US',
      messages: {
        'en-US': en,
        'es': es,
        'ch': ch,
        'vi': vi,
        'ru': ru,
        'fr': fr,
      },
    },
  },
}
