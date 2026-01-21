const express = require('express');
const Deck = require('../models/Deck');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/decks - Get all decks for current user
router.get('/', async (req, res) => {
  try {
    const decks = await Deck.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(decks);
  } catch (error) {
    console.error('Get decks error:', error);
    res.status(500).json({ error: 'Server error fetching decks' });
  }
});

// GET /api/decks/:id - Get single deck
router.get('/:id', async (req, res) => {
  try {
    const deck = await Deck.findOne({ _id: req.params.id, userId: req.userId });

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    res.json(deck);
  } catch (error) {
    console.error('Get deck error:', error);
    res.status(500).json({ error: 'Server error fetching deck' });
  }
});

// POST /api/decks - Create new deck
router.post('/', async (req, res) => {
  try {
    const { name, cards } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Deck name is required' });
    }

    const deck = new Deck({
      userId: req.userId,
      name,
      cards: cards || []
    });

    await deck.save();
    res.status(201).json(deck);
  } catch (error) {
    console.error('Create deck error:', error);
    res.status(500).json({ error: 'Server error creating deck' });
  }
});

// PUT /api/decks/:id - Update deck
router.put('/:id', async (req, res) => {
  try {
    const { name, cards } = req.body;

    const deck = await Deck.findOne({ _id: req.params.id, userId: req.userId });

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    if (name) deck.name = name;
    if (cards) deck.cards = cards;

    await deck.save();
    res.json(deck);
  } catch (error) {
    console.error('Update deck error:', error);
    res.status(500).json({ error: 'Server error updating deck' });
  }
});

// DELETE /api/decks/:id - Delete deck
router.delete('/:id', async (req, res) => {
  try {
    const deck = await Deck.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    res.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    console.error('Delete deck error:', error);
    res.status(500).json({ error: 'Server error deleting deck' });
  }
});

// POST /api/decks/:id/cards - Add card to deck
router.post('/:id/cards', async (req, res) => {
  try {
    const { name, image } = req.body;

    if (!name || !image) {
      return res.status(400).json({ error: 'Card name and image are required' });
    }

    const deck = await Deck.findOne({ _id: req.params.id, userId: req.userId });

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    deck.cards.push({ name, image, progress: 0 });
    await deck.save();

    res.status(201).json(deck);
  } catch (error) {
    console.error('Add card error:', error);
    res.status(500).json({ error: 'Server error adding card' });
  }
});

// PUT /api/decks/:deckId/cards/:cardId/progress - Update card progress
router.put('/:deckId/cards/:cardId/progress', async (req, res) => {
  try {
    const { progress } = req.body;

    if (typeof progress !== 'number') {
      return res.status(400).json({ error: 'Progress must be a number' });
    }

    const deck = await Deck.findOne({ _id: req.params.deckId, userId: req.userId });

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const card = deck.cards.id(req.params.cardId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    card.progress = progress;
    await deck.save();

    res.json(deck);
  } catch (error) {
    console.error('Update card progress error:', error);
    res.status(500).json({ error: 'Server error updating card progress' });
  }
});

// DELETE /api/decks/:deckId/cards/:cardId - Delete card from deck
router.delete('/:deckId/cards/:cardId', async (req, res) => {
  try {
    const deck = await Deck.findOne({ _id: req.params.deckId, userId: req.userId });

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    deck.cards.pull(req.params.cardId);
    await deck.save();

    res.json(deck);
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ error: 'Server error deleting card' });
  }
});

module.exports = router;
