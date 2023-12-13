package video

import (
	"testing"
)

func areSegmentsEqual(a, b *VideoSegment) bool {
	return a.PID == b.PID && a.Start == b.Start && a.End == b.End && a.ID == b.ID
}

func areTimelinesEqual(a, b []*VideoSegment) bool {
	for i := range a {
		if !areSegmentsEqual(a[i], b[i]) {
			return false
		}
	}
	return true
}

func TestVideoTimelineOrdering(t *testing.T) {
	test := struct {
		name     string
		data     VideoTimeline
		expected []*VideoSegment
	}{
		name: "testing ordering after single interval cut",
		data: NewTimeline(),
		expected: []*VideoSegment{
			{
				ID:    "aa",
				Start: 0,
				End:   45.29609367,
				PID:   "a",
			},
			{
				ID:    "ab",
				Start: 45.29609367,
				End:   49.72211538461538,
				PID:   "a",
			},
			{
				ID:    "ac",
				Start: 49.72211538461538,
				End:   78.45,
				PID:   "a",
			},
		},
	}

	test.data.AddSegment("a", 0, 78.45, "None")
	test.data.AddSegment("aa", 0, 45.29609367, "a")
	test.data.AddSegment("ab", 45.29609367, 49.72211538461538, "a")
	test.data.AddSegment("ac", 49.72211538461538, 78.45, "a")
	tdtimeline := test.data.OrderTimeline()

	// get segments only
	orderedTimeline := []*VideoSegment{}

	for _, seg := range tdtimeline {
		if seg.PID != "None" {
			orderedTimeline = append(orderedTimeline, seg)
		}
	}
	if !areTimelinesEqual(orderedTimeline, test.expected) {
		t.Fatalf("got\n %+v, expected\n %+v", orderedTimeline, test.expected)
	}

}
