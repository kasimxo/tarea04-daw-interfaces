const fullText = `DEFINE_STATIC_PERCPU_RWSEM(bp_cpuinfo_sem);
\t\t\tstatic inline struct mutex *get_task_bps_mutex(struct perf_event *bp)
{
	\t\t\tstruct task_struct *tsk = bp->hw.target;

	return tsk ? &tsk->perf_event_mutex : NULL;
}

static struct mutex *bp_constraints_lock(struct perf_event *bp)
{
	struct mutex *tsk_mtx = get_task_bps_mutex(bp);

	if (tsk_mtx) {
		mutex_lock_nested(tsk_mtx, SINGLE_DEPTH_NESTING);
		percpu_down_read(&bp_cpuinfo_sem);
	} else {
		percpu_down_write(&bp_cpuinfo_sem);
	}

	return tsk_mtx;
}

static void bp_constraints_unlock(struct mutex *tsk_mtx)
{
	if (tsk_mtx) {
		percpu_up_read(&bp_cpuinfo_sem);
		mutex_unlock(tsk_mtx);
	} else {
		percpu_up_write(&bp_cpuinfo_sem);
	}
}

static bool bp_constraints_is_locked(struct perf_event *bp)
{
	struct mutex *tsk_mtx = get_task_bps_mutex(bp);

	return percpu_is_write_locked(&bp_cpuinfo_sem) ||
	       (tsk_mtx ? mutex_is_locked(tsk_mtx) :
			  percpu_is_read_locked(&bp_cpuinfo_sem));
}

static inline void assert_bp_constraints_lock_held(struct perf_event *bp)
{
	struct mutex *tsk_mtx = get_task_bps_mutex(bp);

	if (tsk_mtx)
		lockdep_assert_held(tsk_mtx);
	lockdep_assert_held(&bp_cpuinfo_sem);
}

#ifdef hw_breakpoint_slots
static_assert(hw_breakpoint_slots(TYPE_INST) == hw_breakpoint_slots(TYPE_DATA));
static inline int hw_breakpoint_slots_cached(int type)	{ return hw_breakpoint_slots(type); }
static inline int init_breakpoint_slots(void)		{ return 0; }
#else
static int __nr_bp_slots[TYPE_MAX] __ro_after_init;

static inline int hw_breakpoint_slots_cached(int type)
{
	return __nr_bp_slots[type];
}

static __init bool
bp_slots_histogram_alloc(struct bp_slots_histogram *hist, enum bp_type_idx type)
{
	hist->count = kcalloc(hw_breakpoint_slots_cached(type), sizeof(*hist->count), GFP_KERNEL);
	return hist->count;
}

static __init void bp_slots_histogram_free(struct bp_slots_histogram *hist)
{
	kfree(hist->count);
}`;
let text = "";
let index = 0;

document.addEventListener("keypress", function (event) {
    let length = Math.round(Math.random() * 5);
    index += length;
    let hackerContent = document.getElementById("hacker-content");
    hackerContent.innerText = fullText.substring(0, index);
    console.log(fullText.substring(0, index));
});


function showWiki() {
    let hackerContent = document.getElementById("hacker-content");
    let wiki = document.getElementById("wiki");
    hackerContent.classList.add("hidden");
    wiki.classList.remove("hidden");
    wiki.classList.add("shown");
}

function hideWiki() {
    let hackerContent = document.getElementById("hacker-content");
    let wiki = document.getElementById("wiki");
    hackerContent.classList.remove("hidden");
    wiki.classList.add("hidden");
    wiki.classList.remove("shown");
}