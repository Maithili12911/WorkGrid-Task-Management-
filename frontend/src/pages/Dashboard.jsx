import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const columns = ["Backlog", "Yet to Start", "In Progress", "Completed"];

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  

  const [form, setForm] = useState({
    title: "",
    assignee: "",
    status: "",
    priority: "",
    topic: "Development",
    description: "", // Added description field
    due_date: "",
    reminder: false
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await API.get("/tasks");
      const normalized = res.data.map(task => ({
        ...task,
        checklist: Array.isArray(task.checklist)
          ? task.checklist.map(item => ({
              text: item?.text || item?.name || "",
              done: item?.done ?? false
            }))
          : []
      }));
      setTasks(normalized);
    } catch (err) {
      console.error(err);
    }
  };

  const saveTask = async () => {
    const payload = { ...form };
    delete payload._id;

    if (editingTask) {
      await API.put(`/tasks/${editingTask._id}`, payload);
    } else {
      await API.post("/tasks", payload);
    }

    setTimeout(() => { load(); }, 300);
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setForm({
      title: "", assignee: "", status: "",
      priority: "", topic: "Development",
      description: "", // Reset description field
      due_date: "", reminder: false, checklist: []
    });
  };

const grouped = useMemo(() => {
  return columns.reduce((acc, col) => {
    acc[col] = tasks.filter((t) => {
      const text = (t.title ?? "").toLowerCase();

      const matchesSearch = search
        ? text.includes(search.toLowerCase())
        : true;

      const matchesDate = filterDate
        ? t.due_date &&
          new Date(t.due_date).toLocaleDateString("en-CA") === filterDate
        : true;

      return t.status === col && matchesSearch && matchesDate;
    });
    return acc;
  }, {});
}, [tasks, search, filterDate]);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    await API.put(`/tasks/${result.draggableId}`, { status: result.destination.droppableId });
    load();
  };

  const getColumnColor = (col) => {
    switch (col) {
      case "Backlog": return "bg-[#d6bcaf]";
      case "Yet to Start": return "bg-[#fdf5e6]";
      case "In Progress": return "bg-[#cdc0b4]";
      case "Completed": return "bg-[#e8dfd8]";
      default: return "bg-[#f3f2f1]";
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#fdf5e6] font-sans">
      {/* HEADER */}
      <div className="bg-white border-b border-[#d6bcaf] shadow-sm flex h-28 items-center">
        <div className="flex-1 px-6 flex items-center gap-4">
          <img src="/LOGO.png" alt="WorkGrid" className="h-20 w-auto" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 px-3 w-54 border border-[#d6bcaf] rounded-md text-sm outline-none bg-[#fdfcfb] focus:ring-2 focus:ring-[#91565f]"
          />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-10 px-3 w-54 border border-[#d6bcaf] rounded-md text-sm outline-none bg-[#fdfcfb] focus:ring-2 focus:ring-[#91565f]"
          />
        </div>
        <div className="w-[400px] px-6 flex items-center justify-end">
          <button onClick={() => setShowModal(true)} className="h-10 bg-[#91565f] text-white px-6 rounded-md text-sm font-bold shadow-md hover:bg-[#7a4850]">
            + New Task
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* KANBAN */}
        <div className="flex-1 py-6 overflow-x-auto">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 px-6 h-full">
              {columns.map((col) => (
                <Droppable droppableId={col} key={col}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className={`flex flex-col min-w-[310px] max-w-[310px] rounded-2xl p-4 ${getColumnColor(col)} border border-[#d6bcaf]/30 shadow-sm`}>
                      <h2 className="text-center font-bold text-[#91565f] mb-4 uppercase text-xs tracking-widest">{col}</h2>
                      <div className="space-y-3">
                        {grouped[col]?.map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => {
                                  setEditingTask(task);
                                  setForm({ ...task });
                                  setShowModal(true);
                                }}
                                className="bg-white p-5 rounded-xl shadow-sm border border-[#e8dfd8] hover:shadow-md cursor-pointer"
                              >
                                <div className="font-bold text-[#323130] text-sm mb-1">{task.title}</div>
                                <div className="text-[11px] text-[#91565f] mb-2 font-medium">👤 {task.assignee}</div>
                                <div className="flex flex-col gap-1">
                                  <span className={`w-fit text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${task.priority === "Urgent" ? "bg-[#f8d7da] text-[#721c24] border-[#f5c6cb]" : "bg-[#d4edda] text-[#155724] border-[#c3e6cb]"}`}>
                                    {task.priority}
                                  </span>
                                </div>
                                {/* ADD THE DUE DATE HERE */}
  <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-1 italic">
    📅 {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No date"}
  </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </div>

        {/* ANALYTICS */}
        <div className="w-[400px] p-8 bg-white border-l border-[#d6bcaf] hidden lg:block overflow-y-auto">
          <h3 className="font-bold text-[#91565f] mb-6 text-lg">Plan Progress</h3>
          <div className="space-y-5 mb-10">
            {columns.map(col => {
              const count = tasks.filter(t => t.status === col).length;
              const total = tasks.length || 1;
              return (
                <div key={col}>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span>{col}</span>
                    <span>{count}</span>
                  </div>
                  <div className="bg-[#f5ece5] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#91565f] h-full" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <h3 className="font-bold text-[#91565f] mb-4">Calendar</h3>
          <div className="text-xs border rounded-xl p-3 border-[#e8dfd8] bg-[#fdfcfb]">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{ left: "prev,next", center: "title", right: "" }}
              height="auto"
              events={tasks.filter(t => t.due_date).map(t => ({ title: t.title, date: t.due_date, color: "#91565f" }))}
            />
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#91565f]/20 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh] border border-[#d6bcaf]">
            <div className="p-6 border-b border-[#f5ece5]">
              <input
                placeholder="Task Title"
                className="text-xl font-bold w-full outline-none text-[#323130]"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#fdfcfb]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#c07b56] uppercase">Assignee</label>
                  <input className="w-full border border-[#d6bcaf] rounded-lg px-3 py-2 text-sm" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#c07b56] uppercase">Due Date</label>
                  <input type="date" className="w-full border border-[#d6bcaf] rounded-lg px-3 py-2 text-sm" value={form.due_date?.substring(0,10) || ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#c07b56] uppercase">Status</label>
                  <select className="w-full border border-[#d6bcaf] rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="" disabled>--Select--</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#c07b56] uppercase">Priority</label>
                  <select className="w-full border border-[#d6bcaf] rounded-lg px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="" disabled>--Select--</option>
                    <option value="Casual">Casual</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* NEW DESCRIPTION FIELD */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#c07b56] uppercase tracking-wider">Description</label>
                <textarea
                  rows="3"
                  placeholder="Task details and notes..."
                  className="w-full border border-[#d6bcaf] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#91565f] bg-white resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="px-4 py-2 text-sm font-semibold text-[#323130]">
              {editingTask && (
                <button onClick={async () => { if(window.confirm("Delete?")) { await API.delete(`/tasks/${editingTask._id}`); closeModal(); load(); }}} className="text-[#d13438] text-xs font-bold">
                  🗑️ Delete Task
                </button>
              )}
              <div className="flex gap-3">
                <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-[#323130]">Cancel</button>
                <button onClick={saveTask} className="bg-[#91565f] text-white px-8 py-2 rounded-lg font-bold">
                  {editingTask ? "Save" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}