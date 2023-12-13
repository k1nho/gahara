// metadata.go contains all the data structures, and operations that preserve video editing metadata
// for example: if the user cuts the video, metadata will contain this in order to be apply on rendering step
package video

import (
	"fmt"
	"slices"
	"strings"

	"github.com/google/uuid"
	"github.com/k1nho/gahara/internal/constants"
)

type VideoNode struct {
	// RID: the root ID of the node, that is, the original video from which this nodes derives
	RID string `json:"rid"`
	// ID: the ID of the video node
	ID string `json:"id"`
	// Start: the start of the interval
	Start float64 `json:"start"`
	// End: the end of the interval
	End float64 `json:"end"`
}

type Timeline struct {
	// VideoNodes: all the video nodes of the timeline
	VideoNodes []VideoNode `json:"video_nodes"`
}

func NewTimeline() Timeline {
	return Timeline{VideoNodes: []VideoNode{}}
}

func createVideoNode(rid string, start, end float64) VideoNode {
	return VideoNode{
		RID:   rid,
		ID:    strings.Replace(uuid.New().String(), "-", "", -1),
		Start: start,
		End:   end,
	}
}

func (tl *Timeline) Insert(rid string, start, end float64, pos int) error {
	if pos == -1 {
		tl.VideoNodes = append(tl.VideoNodes, createVideoNode(rid, start, end))
		return nil
	}
	if pos < 0 || pos > len(tl.VideoNodes) {
		return fmt.Errorf("Insertion position is invalid")
	}

	tl.VideoNodes = slices.Insert(tl.VideoNodes, pos, createVideoNode(rid, start, end))
	return nil
}

func (tl *Timeline) Delete(pos int) error {
	if pos < 0 || pos > len(tl.VideoNodes) {
		return fmt.Errorf("Insertion position is invalid")
	}
	tl.VideoNodes = append(tl.VideoNodes[:pos], tl.VideoNodes[pos+1:]...)
	return nil
}

func (tl *Timeline) Split(pos int, start, end float64) ([]VideoNode, error) {
	nodes := []VideoNode{}
	if pos < 0 || pos > len(tl.VideoNodes) {
		return nodes, fmt.Errorf("Split position is invalid")
	}

	splitNode := tl.VideoNodes[pos]
	if start <= splitNode.Start+constants.Epsilon {
		nodes = append(nodes, createVideoNode(splitNode.RID, start, end), createVideoNode(splitNode.RID, end+1, splitNode.End))
	} else if end >= splitNode.End {
		nodes = append(nodes, createVideoNode(splitNode.RID, splitNode.Start, start-1), createVideoNode(splitNode.RID, start, splitNode.End))
	} else {
		nodes = append(nodes, createVideoNode(splitNode.RID, splitNode.Start, start), createVideoNode(splitNode.RID, start, end),
			createVideoNode(splitNode.RID, end, splitNode.End))
	}

	tl.VideoNodes = append(tl.VideoNodes[:pos], append(nodes, tl.VideoNodes[pos+1:]...)...)
	return nodes, nil
}
