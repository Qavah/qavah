import React from 'react'
import { useQuery } from '@apollo/client'
import { ALL_PROJECTS, notificationVar } from '../graphql'
import Project from '../components/Project'

function Explorer () {
  const { data: { projects = [] } = {} } = useQuery(ALL_PROJECTS, {
    onError: error => notificationVar(error.message),
  })
  return (
    <div className='Explorer'>
      <h2 className='h2'>All campaigns</h2>
      <div className="projects">
        {projects.map((p, i) => (
          <Project project={p} key={p.id} />
        ))}
      </div>
    </div>
  )
}

export default Explorer
