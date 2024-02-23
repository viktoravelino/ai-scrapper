import reactLogo from './assets/react.svg';
import './App.css';
import Button from './components/Button/Button';

function App() {
    return (
        <>
            <div>
                <a href='https://react.dev' target='_blank'>
                    <img src={reactLogo} className='logo react' alt='React logo' />
                </a>
            </div>
            <h1>React Demo</h1>
            <Button />
        </>
    );
}

export default App;
