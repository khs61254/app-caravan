import express from 'express';

const app = express();
const port = 3001;

app.delete('/api/cavans/:id', (req, res) => {
  console.log(`[Debug] DELETE /api/cavans/:id route reached for id: ${req.params.id}`);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Debug server listening on port ${port}`);
});
