import mongoose from "mongoose";

/**
 * Reusable REST CRUD handler factory for a Mongoose model.
 *
 * Produces { list, getOne, create, update, remove } with:
 *  - pagination (?page, ?limit, ?sort) and simple exact-match filters on any
 *    schema path passed as a query param (e.g. ?status=confirmed&mentorId=…)
 *  - ownership scoping: non-admin users only see/modify docs they own (via the
 *    `owners` fields); admins bypass. `publicRead:true` opens reads to anyone.
 *  - auto-set owner on create (`setOwner`), immutable fields on update
 *  - consistent envelopes + status codes (400 validation/bad id, 403 forbidden,
 *    404 not found, 409 duplicate key).
 *
 * options:
 *   owners: string[]      fields that denote ownership (e.g. ['userId'] or ['menteeId','mentorId'])
 *   setOwner: string      field auto-set to req.user._id on create
 *   immutable: string[]   fields stripped from update bodies
 *   publicRead: boolean   if true, list/getOne skip ownership scoping
 *   defaultSort: string   default sort (default '-createdAt')
 */
export function crudController(Model, opts = {}) {
  const {
    owners = [],
    setOwner = null,
    immutable = [],
    publicRead = false,
    defaultSort = "-createdAt",
  } = opts;

  const name = Model.modelName;
  const isAdmin = (req) => req.user?.role === "admin";
  const ownsDoc = (req, doc) =>
    owners.length === 0 || owners.some((f) => String(doc[f]) === String(req.user._id));
  const ownerFilter = (req) =>
    isAdmin(req) || owners.length === 0
      ? {}
      : { $or: owners.map((f) => ({ [f]: req.user._id })) };

  const handleWriteError = (err, res, next) => {
    if (err.name === "ValidationError") return res.status(400).json({ success: false, message: err.message });
    if (err.code === 11000) return res.status(409).json({ success: false, message: `Duplicate ${name}: ${JSON.stringify(err.keyValue)}` });
    return next(err);
  };

  return {
    list: async (req, res, next) => {
      try {
        const filter = publicRead ? {} : ownerFilter(req);
        for (const [k, v] of Object.entries(req.query)) {
          if (["page", "limit", "sort"].includes(k)) continue;
          if (Model.schema.path(k)) filter[k] = v;
        }
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
        const [data, total] = await Promise.all([
          Model.find(filter).sort(req.query.sort || defaultSort).skip((page - 1) * limit).limit(limit).lean(),
          Model.countDocuments(filter),
        ]);
        res.status(200).json({ success: true, count: data.length, total, page, pages: Math.ceil(total / limit) || 1, data });
      } catch (err) { next(err); }
    },

    getOne: async (req, res, next) => {
      try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid id." });
        const doc = await Model.findById(req.params.id).lean();
        if (!doc) return res.status(404).json({ success: false, message: `${name} not found.` });
        if (!publicRead && !isAdmin(req) && !ownsDoc(req, doc)) return res.status(403).json({ success: false, message: "Not allowed to access this resource." });
        res.status(200).json({ success: true, data: doc });
      } catch (err) { next(err); }
    },

    create: async (req, res, next) => {
      try {
        const body = { ...req.body };
        immutable.forEach((f) => delete body[f]);
        if (setOwner) body[setOwner] = req.user._id;
        const doc = await Model.create(body);
        res.status(201).json({ success: true, data: doc });
      } catch (err) { handleWriteError(err, res, next); }
    },

    update: async (req, res, next) => {
      try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid id." });
        const doc = await Model.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: `${name} not found.` });
        if (!isAdmin(req) && !ownsDoc(req, doc)) return res.status(403).json({ success: false, message: "Not allowed to modify this resource." });
        const body = { ...req.body };
        ["_id", ...immutable].forEach((f) => delete body[f]);
        Object.assign(doc, body);
        await doc.save();
        res.status(200).json({ success: true, data: doc });
      } catch (err) { handleWriteError(err, res, next); }
    },

    remove: async (req, res, next) => {
      try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid id." });
        const doc = await Model.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: `${name} not found.` });
        if (!isAdmin(req) && !ownsDoc(req, doc)) return res.status(403).json({ success: false, message: "Not allowed to delete this resource." });
        await doc.deleteOne();
        res.status(200).json({ success: true, message: `${name} deleted.` });
      } catch (err) { next(err); }
    },
  };
}
