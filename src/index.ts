import app from './app';
import consola from "consola";

const port = process.env.PORT || 5000;
app.listen(port, () => {
  consola.success(`Listening: http://localhost:${port}`);
});
