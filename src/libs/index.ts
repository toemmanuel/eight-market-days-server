export const generateRandomNumber = ({
  length,
  suggestion,
}: {
  length: number;
  suggestion?: string;
}) => {
  let text = '';
  const str =
    suggestion ||
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < length; i++) {
    text += str.charAt(Math.floor(Math.random() * str.length));
  }
  return text;
};
