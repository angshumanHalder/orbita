package cdp

import (
	"context"
	"encoding/json"
	"strings"
	"sync"
	"time"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/cdproto/runtime"
	"github.com/chromedp/chromedp"
)

type NavigationEvent struct {
	URL string
}

type ClickEvent struct {
	Selector string
	X        float64
	Y        float64
}

type NetworkEvent struct {
	Method      string
	URL         string
	Status      int
	Body        string
	ContentType string
}

type InputEvent struct {
	Selector string
	Value    string
	Masked   bool
}

type EventType string

const (
	EventNavigation EventType = "navigation"
	EventClick      EventType = "click"
	EventInput      EventType = "input"
	EventNetwork    EventType = "network"
)

const jsScript = `(function() {
	function sel(el) {
		if (el.id) return '#' + el.id;
		if (el.dataset && el.dataset.testid) return '[data-testid="' + el.dataset.testid + '"]';
		if (el.name) return '[name="' + el.name + '"]';
		return el.tagName.toLowerCase();
	}
	document.addEventListener('click', function(e) {
		console.log('__orbita__' + JSON.stringify({ type: 'click', selector: sel(e.target), x: e.clientX, y: e.clientY }));
	});
	document.addEventListener('change', function(e) {
		let masked = e.target.type === 'password';
		console.log('__orbita__' + JSON.stringify({ type: 'input', selector: sel(e.target), value: masked ? '' : e.target.value, masked: masked }));
	});
}()`

type Event struct {
	Type       EventType
	Timestamp  int64
	Navigation *NavigationEvent
	Click      *ClickEvent
	Input      *InputEvent
	Network    *NetworkEvent
}

type RecordSession struct {
	Events []Event
	mu     sync.Mutex
}

type Recorder struct {
	session *RecordSession
	cancel  context.CancelFunc
	mu      sync.Mutex
}

func NewRecorder() *Recorder {
	return &Recorder{}
}

func (r *Recorder) Start() error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.session != nil {
		return nil
	}
	allocCtx, _ := chromedp.NewRemoteAllocator(context.Background(), "ws://localhost:9222")
	ctx, cancel := chromedp.NewContext(allocCtx)

	r.session = &RecordSession{}
	r.cancel = cancel

	chromedp.ListenTarget(ctx, func(ev any) {
		switch e := ev.(type) {
		case *page.EventFrameNavigated:
			if e.Frame.ParentID == "" { // top-level frame only
				r.session.mu.Lock()
				r.session.Events = append(r.session.Events, Event{
					Type:       EventNavigation,
					Timestamp:  time.Now().UnixMilli(),
					Navigation: &NavigationEvent{URL: e.Frame.URL},
				})
				r.session.mu.Unlock()
			}
		case *runtime.EventConsoleAPICalled:
			r.handleConsoleEvent(e)
		}
	})

	go chromedp.Run(ctx, runtime.Enable(), page.Enable(), chromedp.ActionFunc(func(ctx context.Context) error {
		_, err := page.AddScriptToEvaluateOnNewDocument(jsScript).Do(ctx)
		return err
	}))
	return nil
}

func (r *Recorder) Stop() *RecordSession {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.cancel != nil {
		r.cancel()
		r.cancel = nil
	}
	s := r.session
	r.session = nil
	return s
}

func (r *Recorder) AddNetworkEvent(e NetworkEvent) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.session == nil {
		return
	}
	r.session.mu.Lock()
	defer r.session.mu.Unlock()
	r.session.Events = append(r.session.Events, Event{
		Type:      EventNetwork,
		Timestamp: time.Now().UnixMilli(),
		Network:   &e,
	})
}

func (r *Recorder) handleConsoleEvent(e *runtime.EventConsoleAPICalled) {
	if len(e.Args) == 0 {
		return
	}
	raw := strings.Trim(string(e.Args[0].Value), `"`)
	raw = strings.ReplaceAll(raw, `\"`, `"`) // unescape JSON string
	if !strings.HasPrefix(raw, "__orbita__") {
		return
	}
	payload := strings.TrimPrefix(raw, "__orbita__")

	var m map[string]any
	if err := json.Unmarshal([]byte(payload), &m); err != nil {
		return
	}

	typ, _ := m["type"].(string)
	r.session.mu.Lock()
	defer r.session.mu.Unlock()

	switch typ {
	case "click":
		r.session.Events = append(r.session.Events, Event{
			Type:      EventClick,
			Timestamp: time.Now().UnixMilli(),
			Click: &ClickEvent{
				Selector: m["selector"].(string),
				X:        m["x"].(float64),
				Y:        m["y"].(float64),
			},
		})
	case "input":
		r.session.Events = append(r.session.Events, Event{
			Type:      EventInput,
			Timestamp: time.Now().UnixMilli(),
			Input: &InputEvent{
				Selector: m["selector"].(string),
				Value:    m["value"].(string),
				Masked:   m["masked"].(bool),
			},
		})
	}
}
