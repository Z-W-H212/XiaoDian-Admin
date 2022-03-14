@Library('jenkins-pipeline-library@main') _
pipeline {
    agent { node { label 'nodejs-12' } }
    options { timeout(time: 30, unit: 'MINUTES') }

    stages {
        stage('check env') {
            steps {
                checkEnv()
            }
        }
        stage('build artifact') {
            steps {
                buildArtifact()
            }
        }
        stage('upload artifact') {
            steps {
                uploadArtifact()
            }
        }
        stage('deploy') {
            steps {
                deploy()
            }
        }
        stage('code review') {
            when {
                expression { return env.commitMessage.contains('codeReview')}
            }
            steps {
                codeReview()
            }
        }
        stage('upload Source Maps') {
            steps {
                uploadSourceMaps()
            }
        }
    }
}
