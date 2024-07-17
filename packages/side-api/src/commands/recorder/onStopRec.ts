import { BaseListener } from '../../types'

/**
* Stop recording interactions across playback windows
*/
export type Shape = BaseListener<OnStopRecording>
export type OnStopRecording = [string]