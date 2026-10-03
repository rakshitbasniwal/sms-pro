const Fee      = require('../models/Fee');
const Activity = require('../models/Activity');

const getFees = async (req, res) => {
  try {
    const { studentId, status } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (status)    filter.status    = status;
    const fees = await Fee.find(filter).populate('studentId', 'firstName lastName studentId className section');
    res.json({ data: fees, total: fees.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).populate('studentId', 'firstName lastName studentId');
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    res.json({ data: fee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createFee = async (req, res) => {
  try {
    const fee = await Fee.create(req.body);
    // Log activity
    try {
      await Activity.create({
        type: 'fee_created',
        title: `Fee record created`,
        description: `Type: ${fee.feeType} | Amount: ₹${fee.amount} | Status: ${fee.status}`,
        entityId: fee._id,
        entityType: 'Fee',
        performedBy: req.user?._id,
        icon: '💰',
      });
    } catch (_) {}
    res.status(201).json({ data: fee });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateFee = async (req, res) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    // Log activity if status changed to Paid
    try {
      if (req.body.status === 'Paid') {
        await Activity.create({
          type: 'fee_paid',
          title: `Fee payment received`,
          description: `Type: ${fee.feeType} | Paid: ₹${fee.paidAmount} of ₹${fee.amount}`,
          entityId: fee._id,
          entityType: 'Fee',
          performedBy: req.user?._id,
          icon: '✅',
        });
      }
    } catch (_) {}
    res.json({ data: fee });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/fees/stats
const getFeeStats = async (req, res) => {
  try {
    const all   = await Fee.find({});
    const total = all.reduce((s, f) => s + f.amount, 0);
    const paid  = all.filter(f => f.status === 'Paid').reduce((s, f) => s + f.paidAmount, 0);
    const pending = all.filter(f => f.status !== 'Paid').reduce((s, f) => s + (f.amount - f.paidAmount), 0);
    res.json({ data: { total, paid, pending, count: all.length } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getFees, getFeeById, createFee, updateFee, deleteFee, getFeeStats };
