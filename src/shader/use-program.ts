import { useCallback, useEffect, useState } from 'react'
import { ProgramResult, useShader } from './use-shader'

type ProgramId = string

interface ProgramConfig {
	readonly id: ProgramId
	readonly vertex: string
	readonly fragment: string
}

interface Props {
	gl?: WebGL2RenderingContext
	programs?: ProgramConfig[]
}

export function useProgram({ gl, programs }: Props) {
	const { createProgram, removeProgram } = useShader({ gl })
	const [programResults, setProgramResults] = useState<Record<ProgramId, ProgramResult>>({})
	const [usedProgram, setUsedProgram] = useState<WebGLProgram | undefined>()

	useEffect(() => () => Object.values(programResults).forEach(removeProgram), [programResults, removeProgram])

	useEffect(() => {
		setProgramResults((results) => {
			const newResults: Record<ProgramId, ProgramResult> = {
				...results,
			}
			const existingProgramIds = new Set()
			for (let id in results) {
				existingProgramIds.add(id)
			}

			programs?.forEach((program) => {
				existingProgramIds.add(program.id)
				if (!results[program.id]) {
					const result = createProgram(program)
					if (result) {
						newResults[program.id] = result
					}
				}
			})
			Object.entries(newResults).forEach(([programId, result]) => {
				if (!existingProgramIds.has(programId)) {
					removeProgram(result)
					delete newResults[programId]
				}
			})
			return newResults
		})
	}, [programs, createProgram, removeProgram])

	const setActiveProgram = useCallback(
		(programId?: ProgramId): boolean => {
			if (gl && programId) {
				const result = programResults[programId]
				if (result?.program) {
					gl.useProgram(result.program)
					setUsedProgram(result.program)
					return true
				}
			}
			return false
		},
		[gl, programResults]
	)

	const getUniformLocation = useCallback(
		(name: string, programId?: ProgramId): WebGLUniformLocation | undefined => {
			if (gl) {
				const program = programId ? programResults[programId]?.program : usedProgram
				if (program) {
					return gl.getUniformLocation(program, name) ?? undefined
				}
			}
			return
		},
		[gl, programResults, usedProgram]
	)

	const getAttributeLocation = useCallback(
		(name: string, programId?: ProgramId): number => {
			if (gl) {
				const program = programId ? programResults[programId]?.program : usedProgram
				if (program) {
					return gl.getAttribLocation(program, name) ?? -1
				}
			}
			return -1
		},
		[gl, programResults, usedProgram]
	)

	useEffect(() => {
		if (gl && !usedProgram) {
			setActiveProgram(programs?.[0].id)
		}
	}, [gl, setActiveProgram, usedProgram, programs])

	return {
		usedProgram,
		getAttributeLocation,
		getUniformLocation,
		setActiveProgram,
	}
}