import axios from 'axios';

export const ErrorMessage = async (message?: string) => {
  if (`${process.env.NEXT_PUBLIC_APP_ENV}` === 'development') {
    const payload = {
      attachments: [
        {
          text: message,
          color: 'danger', // "good" (green), "warning" (yellow), "danger" (red), or a hex color code (e.g., "#439FE0")
        },
      ],
    };

    await axios
      .post('/api/slack/send-incoming-webhook', payload)
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
  }
};
