import { BaseListener } from '../../types'

/**
* Start recording interactions across playback windows
*/
export type Shape = BaseListener<OnStartRecording>
export type OnStartRecording = [string]