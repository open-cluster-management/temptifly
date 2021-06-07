'use strict'


import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Spinner } from '@patternfly/react-core'
import ControlPanelFormGroup from './ControlPanelFormGroup'
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon'
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon'
import get from 'lodash/get'
import uniq from 'lodash/uniq'
import invert from 'lodash/invert'

class ControlPanelComboBox extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleControlChange: PropTypes.func,
    i18n: PropTypes.func,
  };

  static getDerivedStateFromProps(props, state) {
    const { control, handleControlChange } = props
    const handleComboChange = selectedItem => {
      control.active = (selectedItem||'').trim()
      handleControlChange()
    }
    const { active } = control
    const { currentSelection } = state
    let {
      isOpen,
      preselect,
      searchText
    } = state
    const {
      isBlurred,
    } = state

    /////////////////////////////////////////////////////////////
    // search mode
    if (searchText && searchText.length && !preselect) {
      // nothing selected, filter list
      if (currentSelection === undefined) {
        if (!isOpen || isBlurred) {
          handleComboChange(searchText)
          searchText = null
          isOpen = false
        }
      } else {
        // handle change
        handleComboChange(currentSelection)
        isOpen = false
        searchText = null
      }
    } else if (currentSelection !== undefined) {
      // handle change
      handleComboChange(currentSelection)
      searchText = null
      isOpen = false
      preselect = false
    } else if (isBlurred && !preselect) {
      isOpen = false
    }
    return {
      active,
      currentSelection: undefined,
      isOpen,
      isBlurred: false,
      preselect,
      searchText
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      isOpen: false,
      isBlurred: false,
      searchText: null
    }
  }

  setInputRef = (ref) => {
    this.inputRef = ref
  };

  setMenuRef = (ref) => {
    this.menuRef = ref
  };

  setClearRef = (ref) => {
    this.clearRef = ref
  };

  setToggleRef = (ref) => {
    this.toggleRef = ref
  };

  render() {
    const {
      isOpen,
      searchText,
    } = this.state
    const { controlId, i18n, control } = this.props
    const {
      name,
      userData = [],
      availableMap,
      exception,
      hasReplacements,
      isFailed,
      fetchAvailable,
      isRefetching,
      disabled,
      simplified,
    } = control
    let { isLoading } = control
    let { active, available=[], placeholder = '' } = control
    let loadingMsg
    if (fetchAvailable) {
      if (isLoading) {
        loadingMsg = i18n(
          get(control, 'fetchAvailable.loadingDesc', 'resource.loading'))
      } else if (isFailed) {
        placeholder = i18n('resource.error')
      } else if (available.length === 0) {
        placeholder =
          placeholder ||
          i18n(
            get(control, 'fetchAvailable.emptyDesc', 'resource.empty'))
      }
    } else if (isLoading) {
      loadingMsg = i18n(
        'creation.loading.values',
        [name.toLowerCase()]
      )
    }
    if (!placeholder) {
      placeholder = i18n(
        'creation.enter.value',
        [name.toLowerCase()]
      )
    }
    available = uniq([...userData, ...available])

    // when available map has descriptions of choices
    // ex: instance types have # cpu's etc
    if (availableMap && !hasReplacements) {
      const map = invert(availableMap)
      active = map[active] || active
    }

    // if active was preset by loading an existing resource
    // initialize combobox to that value
    if (active && available.length === 0) {
      available.push(active)
      if (isLoading) {
        available.push(loadingMsg)
      } else if (isFailed) {
        available.push(placeholder)
      }
      isLoading = false
    }

    let currentAvailable = available
    if (!isLoading && searchText && searchText.length) {
      const findText = searchText.toLowerCase()
      currentAvailable = available.filter(item => {
        return item.toLowerCase().includes(findText)
      })
      if (currentAvailable.length===0) {
        currentAvailable = available
      }
    }
    const items = currentAvailable.map((label, inx) => {
      return { label, id: inx }
    })
    const key = `${controlId}-${name}-${active}`
    const toggleClasses = classNames({
      'tf--list-box__menu-icon': true,
      'tf--list-box__menu-icon--open': isOpen
    })
    const inputClasses = classNames({
      'pf-c-form-control': true,
      'input': true,
      'disabled': disabled
    })
    const aria = isOpen ? 'Close menu' : 'Open menu'
    const validated = exception ? 'error' : undefined
    let value = typeof searchText === 'string' ? searchText : active || ''
    value = simplified && simplified(value, control) || value

    return (
      <React.Fragment>
        <div className="creation-view-controls-combobox">
          <ControlPanelFormGroup
            controlId={controlId}
            control={control}>
            {isLoading || isRefetching ? (
              <div className="creation-view-controls-singleselect-loading  pf-c-form-control">
                <Spinner size="md" />
                <div>{active}</div>
              </div>
            ) : (
              <div id={`${controlId}-group`}>
                <div
                  role="listbox"
                  aria-label="Choose an item"
                  tabIndex="0"
                  className="tf--list-box"
                >
                  <div
                    role="button"
                    className=""
                    tabIndex="0"
                    type="button"
                    aria-label={aria}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    data-toggle="true"
                    onClick={this.clickToggle.bind(this)}
                    onKeyPress={this.pressToggle.bind(this)}
                  >
                    <div className={inputClasses}>
                      <input
                        className="pf-c-combo-control"
                        aria-label="ListBox input field"
                        spellCheck="false"
                        role="combobox"
                        disabled={disabled}
                        aria-controls={key}
                        aria-expanded="true"
                        autoComplete="off"
                        id={controlId}
                        placeholder={placeholder}
                        ref={this.setInputRef}
                        style={validated === 'error' ? {borderBottomColor: 'red'} : undefined}
                        value={value}
                        onBlur={this.blur.bind(this)}
                        onKeyUp={this.pressUp.bind(this)}
                        onKeyDown={this.pressDown.bind(this)}
                        onFocus={e => {
                          e.target.select()
                        }}
                        onChange={evt =>
                          this.setState({ searchText: evt.currentTarget.value })
                        }
                        data-testid={`combo-${controlId}`}
                      />
                    </div>
                    {!disabled && (searchText || active) && <div
                      role="button"
                      className="tf--list-box__selection"
                      tabIndex="0"
                      title="Clear selected item"
                      ref={this.setClearRef}
                      onClick={this.clickClear.bind(this)}
                      onKeyPress={this.pressClear.bind(this)}
                    >
                      <TimesCircleIcon aria-hidden />
                    </div>}
                    {!disabled && <div
                      role="button"
                      tabIndex="0"
                      className={toggleClasses}
                      ref={this.setToggleRef}
                      onClick={this.clickToggle.bind(this)}
                      onKeyPress={this.pressToggle.bind(this)}
                    >
                      <svg
                        fillRule="evenodd"
                        height="5"
                        role="img"
                        viewBox="0 0 10 5"
                        width="10"
                        alt={aria}
                        aria-label={aria}
                      >
                        <title>Close menu</title>
                        <path d="M0 0l5 4.998L10 0z" />
                      </svg>
                    </div>}
                    {fetchAvailable && !(searchText || active) && <div
                      role="button"
                      tabIndex="0"
                      className="tf--list-box__refresh-icon"
                      type="button"
                      onClick={this.clickRefresh.bind(this)}
                      onKeyPress={this.clickRefresh.bind(this)}
                    >
                      <svg
                        fillRule="evenodd"
                        height="12"
                        role="img"
                        viewBox="0 0 12 12"
                        width="12"
                        alt={aria}
                        aria-label={aria}
                      >
                        <title>Refresh</title>
                        <path d="M8.33703191,2.28461538 L6.50516317,0.553494162 L7.02821674,3.11581538e-14 L9.9,2.71384343 L7.02748392,5.41285697 L6.50601674,4.85786795 L8.43419451,3.04615385 L4.95,3.04615385 C2.63677657,3.04615385 0.761538462,4.92139195 0.761538462,7.23461538 C0.761538462,9.54783882 2.63677657,11.4230769 4.95,11.4230769 C7.26322343,11.4230769 9.13846154,9.54783882 9.13846154,7.23461538 L9.9,7.23461538 C9.9,9.9684249 7.68380951,12.1846154 4.95,12.1846154 C2.21619049,12.1846154 0,9.9684249 0,7.23461538 C-1.77635684e-15,4.50080587 2.21619049,2.28461538 4.95,2.28461538 L8.33703191,2.28461538 Z" id="restart"></path>
                      </svg>
                    </div>}
                  </div>
                  {!disabled && isOpen && (
                    <div className="tf--list-box__menu" key={key} id={key} ref={this.setMenuRef} >
                      {items.map(
                        ({ label, id }) => {
                          const itemClasses = classNames({
                            'tf--list-box__menu-item': true,
                            searching: searchText,
                          })
                          return (
                            <div
                              role="button"
                              key={label}
                              className={itemClasses}
                              id={`${controlId}-item-${id}`}
                              tabIndex="0"
                              onMouseDown={()=>this.setState({preselect: true})}
                              onClick={this.clickSelect.bind(this, label)}
                              onKeyPress={this.pressSelect.bind(this, label)}
                            >
                              {this.renderLabel(label, searchText, active, control, simplified)}
                            </div>
                          )
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>)}
          </ControlPanelFormGroup>
        </div>
      </React.Fragment>
    )
  }

  renderLabel(label, searchText, active, control, simplified) {
    if (!simplified || (simplified && searchText)) {
      if (!searchText) {
        return (
          <React.Fragment>
            {label}
          </React.Fragment>
        )
      } else {
        const inx = label.toLowerCase().indexOf(searchText.toLowerCase())
        label = [
          label.substr(0, inx),
          label.substr(inx, searchText.length),
          label.substr(inx + searchText.length)
        ]
        return (
          <React.Fragment>
            {label[0]}
            <b>{label[1]}</b>
            {label[2]}
          </React.Fragment>
        )
      }
    } else {
      const title = simplified && simplified(label, control)
      return (
        <div className='tf--list-box__menu-item-container'>
          {title&&<div style={{lineHeight: '14px', fontSize: '16px'}}>{title}</div>}
          <div style={{fontSize: '12px'}}>{label}</div>
          {label===active && <span className="tf-select__menu-item-icon">
            <CheckIcon aria-hidden />
          </span>}
        </div>
      )
    }
  }

  blur() {
    this.setState({isBlurred: true})
  }

  pressUp(e) {
    if (e.key === 'Enter' && this.state.searchText) {
      const { searchText } = this.state
      const { control, handleControlChange } = this.props
      control.userData = control.userData || []
      control.userData.push(searchText)
      control.active = (searchText||'').trim()
      handleControlChange()
      this.setState({
        currentSelection: undefined,
        isOpen:false,
        searchText: null
      })
    }
  }

  pressDown(e) {
    if (e.key === 'Escape') {
      this.clickClear()
    }
  }

  clickRefresh(e) {
    e.preventDefault()
    e.stopPropagation()
    const { control } = this.props
    const { fetchAvailable } = control
    if (fetchAvailable) {
      const { refetch } = fetchAvailable
      if (typeof refetch === 'function') {
        delete control.available
        refetch()
      }
      this.clickClear()
    }
  }

  pressToggle(e) {
    if (e.key === 'Enter') {
      this.clickToggle()
    } else if (e.key === 'Escape') {
      this.clickClear()
    }
  }

  clickToggle(e) {
    if (e) {
      e.stopPropagation()
    }
    const clickedWithinClear = e && this.clearRef && this.clearRef.contains && this.clearRef.contains(e.target)
    const clickedWithinToggle = e && this.toggleRef && this.toggleRef.contains && this.toggleRef.contains(e.target)
    if (!(this.state.searchText || clickedWithinClear) || clickedWithinToggle) {
      const { control } = this.props
      const {
        simplified,
      } = control
      this.setState(preState => {
        let {
          currentAvailable,
          currentSelection,
          searchText,
          isOpen
        } = preState
        isOpen = !isOpen
        if (!isOpen) {
          currentAvailable = []
          currentSelection = undefined
          searchText = null
        } else if (this.inputRef.value && !simplified) {
          searchText = this.inputRef.value
        }
        return {
          currentAvailable,
          currentSelection,
          searchText,
          isOpen
        }
      })
    }
  }

  pressSelect(label, e) {
    if (e.key === 'Enter') {
      this.clickSelect(label)
    }
  }

  clickSelect(label) {
    this.setState({ currentSelection: label, isOpen: false })
  }

  pressClear(inx, e) {
    if (e && e.key === 'Enter') {
      this.clickClear()
    }
  }

  clickClear() {
    this.setState({ searchText: null })
    const { control, handleControlChange } = this.props
    control.active = ''
    handleControlChange()
  }
}

export default ControlPanelComboBox
